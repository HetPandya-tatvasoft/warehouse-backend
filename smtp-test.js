import { createTransport } from 'nodemailer';

const transporter = createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: 'b2bfdf001@smtp-brevo.com',
    pass: 'xsmtpsib-5758aab4728913ebd556846528343611ece60ba8ca80248cfe3733db10e35be7-kwsQZQzBGiKvZBpr',
  },
});

transporter
  .verify()
  .then(() => console.log('Brevo SMTP Connected successfully!'))
  .catch(console.error);

