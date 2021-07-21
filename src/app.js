import cors from "cors";
import { json } from "body-parser";
import express from "express";
import consola from "consola";
const DBConnection = require('./database/connection');
import passport from "passport";

// Import Application Constants
import {PORT,DB} from "./constants";

// Router Import
import userApis from './apis/users.route';

// Import passport Middelware
require("./middlewares/passport.middleware");

// Initialize express applicaion
const app = express();

// Apply Application Middlewares
app.use(cors());
app.use(json());
app.use(passport.initialize());

// Inject Sub Router and apis
app.use('/users',userApis);

// Implement Main startUp Function
const main = async()=>{
    try{
        // connect to database
        DBConnection(DB);
        // start application start listening for request server
        app.listen(PORT,()=>{
            consola.success(`Server Listening on Port ${PORT}...`);
        });
    }catch(error){
        consola.error(new Error(`Unable to start the server \n${error.message}`));
    }
};

main();