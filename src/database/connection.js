import mongoose from "mongoose";
import consola from "consola";

const DBConnection = async(DB)=>{
    try{
        await mongoose.connect(DB,{
            useCreateIndex:true,
            useFindAndModify:true,
            useNewUrlParser:true,
            useUnifiedTopology:true
        });
        consola.success(`Database Connected...`);
        consola.info(`Database Connected on ${DB}`);
    }catch(error){
        consola.error(new Error(`#Database Connection Faild! ${error.message}`));
    }
}

module.exports=DBConnection;