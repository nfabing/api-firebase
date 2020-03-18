import * as functions from 'firebase-functions';
import { getAllEquipments, postEquipment} from "./handlers/equipments";
import {getUserProfil, signup, login, uploadImage} from "./handlers/users";
import {admin, db, app} from "./util/FBAdmin";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
// express https://expressjs.com/

export let userHandle: any;
const FBAuth = (req: any, res: any, next: any) => {
    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idToken = req.headers.authorization.split('Bearer ')[1]; // récupération du token
    } else {
        console.error('Aucun token trouvée !')
        return res.status(403).json({error: 'Non Autorisé'});
    }

    // Vérification du IdToken
    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            req.user = decodedToken;

            // on rècupère le document user de l'utilisateur connectée
            // req.user.uid = Identifiant de l'utilisateur
            return db
                .collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get()

        }).then(data => {

        // Récupération du champ handle de l'utilisateur
        userHandle = data.docs[0].data().handle;
        return next();

    }).catch(err => {
        console.error('Erreur durant vérification du token', err)
        return res.status(403).json(err);
    })
}


// ROUTES EQUIPMENTS

// Récupération de tous les équipements
app.get('/equipments', getAllEquipments);

// Ajout d'un équipement
app.post('/equipment', FBAuth, postEquipment)

// ROUTES USER

// Route Récupération profil
app.get('/profil', getUserProfil)

// Route inscription
app.post('/signup', signup)

// Route connexion
app.post('/login', login)

// Upload image de profil
app.post('/user/image', FBAuth, uploadImage)


export const api = functions.region('europe-west1').https.onRequest(app);
