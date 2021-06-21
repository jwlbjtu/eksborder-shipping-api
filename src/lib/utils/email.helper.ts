import sgMail from '@sendgrid/mail';
import util from 'util';
import { logger } from '../logger';

export const sendCsvImportEmail = async (
  name: string,
  email: string,
  total: number,
  success: number
): Promise<void> => {
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: email, // Change to your recipient
      from: 'support@eksborder.com', // Change to your verified sender
      subject: 'CSV Import notification',
      text: 'CSV Import notification',
      html: createEmailBody(`         
            <h3>CSV Import Notification</h3>              
            <p>Hi ${name},</p>
            <p>We have just completed your import process!</p>
            <p>Result:</p>
            <ul>
                <li>total rows processed: ${total}</li>
                <li>orders successfully uploaded: ${success}</li>
            </ul>
            <p>You've successfully imported all of your orders! You'll see them on your Orders page.</p>
            <p>If you encounter any problems or have any questions, please contact us at <a href="mailto:support@eksborder.com">support@eksborder.com</a></p>
        `)
    };
    sgMail
      .send(msg)
      .then(() => {
        logger.info(`CSV import email sent to user ${email}`);
      })
      .catch((error) => {
        logger.error(`CSV import email failed to send to user ${email}`);
        logger.error(util.inspect(error, true, null));
      });
  } else {
    logger.error('SENDGRID_API_KEY is missing');
  }
};

export const resetPasswordEmail = async (
  firstName: string,
  lastName: string,
  email: string,
  url: string
): Promise<void> => {
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: email, // Change to your recipient
      from: 'support@eksborder.com', // Change to your verified sender
      subject: 'ParcelsElite 密码重置',
      text: 'ParcelsElite 密码重置',
      html: createEmailBody(`         
            <h3>密码重置</h3>              
            <p>${lastName}${firstName}您好,</p>
            <p>请使用此 <a href=${url}>链接</a> 重置您的账号密码.</p>
            <p>如遇任何问题, 请发邮件到 <a href="mailto:support@eksborder.com">support@eksborder.com</a></p>
        `)
    };
    sgMail
      .send(msg)
      .then(() => {
        logger.info(`Reset password email sent to user ${email}`);
      })
      .catch((error) => {
        logger.error(`Reset password email failed to send to user ${email}`);
        logger.error(util.inspect(error, true, null));
      });
  } else {
    logger.error('SENDGRID_API_KEY is missing');
  }
};

const createEmailBody = (content: string): string => {
  return `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml" lang="en-GB">
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <title>Demystifying Email Design</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            </head>
            <body bgcolor="#f1f1f1">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border: solid 1px #dddddd">
                <tr>
                    <td bgcolor="#fff">
                        <img src="https://i.ibb.co/0YWTCqV/4385691-LOGO-96x96.png" alt="ParcelsElite" width="96" height="96" style="display: block; margin-left: 250px;" />
                    </td>
                </tr>
                <tr>
                    <td bgcolor="#ffffff" style="padding: 20px 20px">
                    ${content}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px 20px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                            <tr bgcolor="#f1f1f1">
                                <td style="text-align: right; width: 269px; padding-right: 10px">
                                    <a style="margin: 0;" href="mailto:support@eksborder.com">联系我们</a>
                                </td>
                                <td style="text-align: left; padding-left: 10px">
                                    <a style="margin: 0;" href="www.parcelselite.com">前往ParcelsElite</a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            </body>
            </html>
        `;
};
