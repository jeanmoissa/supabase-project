const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendPasswordResetEmail = async (email, token) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_EMAIL_FROM,
      to: email,
      subject: 'Redefinição de Senha',
      html: `
        <p>Você solicitou a redefinição de senha.</p>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Se você não solicitou isso, por favor ignore este e-mail.</p>
      `
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail
};