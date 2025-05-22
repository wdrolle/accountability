import React from 'react';

interface EmailTemplateProps {
  title: string;
  message: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  title,
  message,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
    <div style={{ background: 'linear-gradient(to right, #6B46C1, #4A1D96)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      <h1 style={{ color: 'white', margin: 0, textAlign: 'center' }}>{title}</h1>
    </div>
    <div style={{ color: '#333', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: message }} />
    <div style={{ marginTop: '30px', padding: '20px', borderTop: '1px solid #eee', color: '#666', fontSize: '14px', textAlign: 'center' }}>
      <p>Daily Messages - Connecting through Prayer</p>
      <p>This email was sent from Daily Messages. Please do not reply to this email.</p>
    </div>
  </div>
); 