import {db, storage} from "../util/FBAdmin";
import * as firebase from "firebase";
import * as Busboy from "busboy";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import {userHandle} from "../index";
import firebaseConfig from "../util/config";

firebase.initializeApp(firebaseConfig);
// Inscription
export const signup = (req: any, res: any) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    }

    let token: string;
    let userId: string;
    db.doc(`/users/${newUser.handle}`)
        .get()
        // @ts-ignore
        .then((doc) => {
            if (doc.exists) {
                return res
                    .status(400)
                    .json({handle: 'handle déja utiliser'});
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password);
            }
        }).then((data: { user: { uid: string; getIdToken: () => any; }; }) => {
        userId = data.user.uid
        return data.user?.getIdToken();

    }).then((tokenId: string) => {
        token = tokenId;
        const defaultImg = 'no-img.png' // img par défault
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${defaultImg}?alt=media`,
            userId
        };
        return db
            .doc(`/users/${newUser.handle}`)
            .set(userCredentials);

    }).then(() => {
        return res.status(201).json({token})

    }).catch((err: { code: string; }) => {
        console.error(err);
        if (err.code === 'auth/email-already-in-use') {
            return res.status(400).json({email: 'Email déja utiliser !'})

        } else {
            return res.status(500).json({error: err.code})
        }
    })
}


// Connexion
export const login = (req: any, res: any) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    firebase
        .auth()
        .signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user?.getIdToken();

        }).then(token => {
        return res.json({token})

    }).catch(err => {
        console.error(err)
        if (err.code === 'auth/wrong-password') {
            return res.status(403).json({error: 'Mot de passe incorrect'})
        } else {
            return res.status(500).json({error: 'Erreur serveur'})
        }

    })
}


// Récupération d'un profil grâce à un email
export const getUserProfil = (req: any, res: any) => {
    const email = req.query.email;
    let profil = {}

    db
        .collection('users')
        .where('email', '==', email)
        .get()
        .then((data: any) => {
            data.forEach((profilData: any) => {
                profil = profilData.data();
            });
            res.json(profil)

        }).catch((err: any) => {
        res.status(400).json({error: err})
    })
}

// Upload image de profil
export const uploadImage = (req: any, res: any) => {
    // @ts-ignore
    let imageToBeUploaded: any;
    let imageFileName: string;
    const busboy = new Busboy({headers: req.headers});

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(fieldname);
        console.log(filename);
        console.log(mimetype);

        if (mimetype !== 'image/png' && mimetype !== 'image/jpeg' && mimetype !== 'image/jpg') {
            return res.status(400).json({error : 'Mauvais format de fichier'})
        }

        const imgExtension = filename.split('.').pop();
        imageFileName = `${Math.floor(Math.random() * 10000000)}.${imgExtension}`;

        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {filepath, mimetype};
        file.pipe(fs.createWriteStream(filepath));

        console.log(imgExtension)

    });
    busboy.on('finish', () => {
        storage.bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        }).then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`
            return db.doc(`/users/${userHandle}`).update({imageUrl})
        })
            .then(() => {
                return res.json({message: 'Image upload avec succès !'})
            }).catch((err) => {
            console.log(err);
            return res.status(500).json(err)
        })
    })
    busboy.end(req.rawBody);

}
