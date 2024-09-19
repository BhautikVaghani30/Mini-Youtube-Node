import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js"
dotenv.config(
    {
        path: './env'
    }
)

connectDB().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server is runing at port : ${process.env.PORT}`);
    })
    app.on("Error",(error) => {
        console.log("error occuerd : " + error);

    })
}).catch((error) => {
    console.log("MONGODB connection feiled !!!", error);

})

