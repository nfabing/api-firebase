import { db } from "../util/FBAdmin";
import { userHandle } from "../index";

export const getAllEquipments = (req: any, res: any) => {

    db
        .collection('equipment')
        .orderBy('name', 'desc')
        .get()
        .then((data: any) => {
            let equipment: FirebaseFirestore.DocumentData[] = []
            data.forEach((doc: any) => {
                equipment.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return res.json(equipment);
        }).catch((err: any) => {
        console.log('Error', err)
        return res.status(500);
    })
}


export const postEquipment = (req: any, res: any) => {

    // Récup data en post
    const data = {
        name: req.body.name,
        status: req.body.status,
        userHandle: userHandle,
    }

    db
        .collection('equipment')
        .add(data)
        .then((doc: { id: any }) => {
            res.json({message: `Document ${doc.id} crée avec succées !`})
        }).catch((err: any) => {
        res
            .status(500)
            .json({error: 'Erreur 500'});
        console.error(err);
    });

}
