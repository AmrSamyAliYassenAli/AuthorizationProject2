import sgMail from "@sendgrid/mail";
import { SENDGRID_APIKEY , HOST_EMAIL } from "../constants";

sgMail.setApiKey(SENDGRID_APIKEY);

const sendMail = async (email,subject,text,html) =>{
    try {
        const msg = {
            html,
            text,
            subject,
            to:email,
            from:HOST_EMAIL
        };
        console.log(msg);
        await sgMail.send(msg);
        console.log("MAIL_SEND_SUCCESS:",error.message);
    } catch (error) {
        console.log("ERROR_MAIL_SERVER:",error.message);
    }finally{
        return;
    }
};

export default sendMail;