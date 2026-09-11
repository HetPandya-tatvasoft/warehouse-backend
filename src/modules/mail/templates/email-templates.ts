export const EMAIL_TEMPLATES = {
  welcomeUser: (firstName: string, lastName: string, email: string, passwordHash: string) => ({
    subject: 'Welcome to Warehouse Inventory Management - Your Account Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c3e50;">Welcome to Warehouse Inventory Management</h2>
        <p>Hello <strong>${firstName} ${lastName}</strong>,</p>
        <p>Your user account has been successfully created. Here are your account login credentials:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #007bff;">
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Password:</strong> ${passwordHash}</p>
        </div>
        <p>Please log in and change your password as soon as possible for security reasons.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">This is an automated notification from Warehouse Inventory Management System.</p>
      </div>
    `,
  }),

  tenantOnboarding: (
    firstName: string,
    lastName: string,
    companyName: string,
    loginUrl: string,
    email: string,
    tempPassword: string,
  ) => ({
    subject: 'Welcome to Warehouse Inventory Management - Your Account Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c3e50;">Welcome to Warehouse Inventory Management</h2>
        <p>Hello <strong>${firstName} ${lastName}</strong>,</p>
        <p>Your tenant <strong>${companyName}</strong> has been successfully onboarded. Here are your account credentials:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #007bff;">
          <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          <p style="margin: 5px 0;"><strong>Login Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
        </div>
        <p>Please log in using the temporary password above. You will be prompted to change your password upon your first login.</p>
      </div>
    `,
  }),
};
