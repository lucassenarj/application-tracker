export function renderTransactionalEmail(input: {
  greetingName?: string;
  heading: string;
  bodyText: string;
  buttonText: string;
  buttonHref: string;
  footnote?: string;
}): string {
  const greeting = input.greetingName ? `Hi ${input.greetingName},` : 'Hello,';

  const footnoteRow = input.footnote
    ? `<tr>
        <td style="padding: 24px 40px 0; font-family: Arial, sans-serif; font-size: 13px; color: #9a9a9a; text-align: center;">
          ${input.footnote}
        </td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; background-color: #f5f5f4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f4; padding: 40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
            <tr>
              <td style="padding: 32px 40px 0; text-align: center;">
                <img src="${process.env.FRONTEND_URL}/logo.png" alt="Application Tracker" width="180" style="display: block; margin: 0 auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 40px 0; font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; color: #1a1a1a; text-align: center;">
                ${input.heading}
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 40px 0; font-family: Arial, sans-serif; font-size: 15px; color: #1a1a1a; text-align: center;">
                ${greeting}
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 40px 0; font-family: Arial, sans-serif; font-size: 15px; color: #4a4a4a; text-align: center; line-height: 1.5;">
                ${input.bodyText}
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 40px 0; text-align: center;">
                <a href="${input.buttonHref}" style="display: inline-block; background-color: #059669; color: #d4a574; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  ${input.buttonText}
                </a>
              </td>
            </tr>
            ${footnoteRow}
            <tr>
              <td style="padding: 32px 40px 32px; font-family: Arial, sans-serif; font-size: 12px; color: #b5b5b5; text-align: center;">
                Application Tracker
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
