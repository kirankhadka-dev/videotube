import express from "express";
import cors from cors;
import cookieParser from "cookie-parser";



app.use(cors({origin:process.env.CORS_ORIGIN,credentials:true}))


// Middleware to handle json data 
app.use(express.json({limit:"16kb"}))

//Middleware to handle url data 

app.use(express.urlencoded({extended:true,limit:"16kb"}))


// Middleare to handle static files 

app.use(express.static("public"))


// Middleware to handle cookie-data 

app.use(cookieParser())












const app = express();

export { app };
