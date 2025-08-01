// Force trigger session creation to see detailed logs
console.log('=== FORCING SESSION CREATION ===');

// Get current auth token from localStorage
const authToken = localStorage.getItem('authToken');
console.log('Auth token in localStorage:', authToken ? authToken.substring(0, 20) + '...' : 'NONE');

// Get session token from cookies
const cookies = document.cookie.split(';');
const sessionCookie = cookies.find(c => c.trim().startsWith('sessionToken='));
const sessionToken = sessionCookie ? sessionCookie.split('=')[1] : null;
console.log('Session token from cookies:', sessionToken ? sessionToken.substring(0, 20) + '...' : 'NONE');

// Set auth token from cookies if missing
if (!authToken && sessionToken) {
  localStorage.setItem('authToken', sessionToken);
  console.log('Set auth token from cookies to localStorage');
}

// Force trigger session creation mutation
const createSessionButton = document.createElement('button');
createSessionButton.textContent = 'FORCE CREATE SESSION';
createSessionButton.onclick = async () => {
  console.log('🔄 [FORCE] Starting session creation...');
  
  try {
    const response = await fetch('/api/chat/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
        'X-Session-Token': sessionToken
      },
      credentials: 'include'
    });
    
    console.log('🔄 [FORCE] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [FORCE] Session creation failed:', response.status, errorText);
    } else {
      const session = await response.json();
      console.log('✅ [FORCE] Session created:', session);
      alert(`Session created successfully: ${session.id}`);
    }
  } catch (error) {
    console.error('❌ [FORCE] Error:', error);
  }
};

document.body.appendChild(createSessionButton);
createSessionButton.style.position = 'fixed';
createSessionButton.style.top = '10px';
createSessionButton.style.right = '10px';
createSessionButton.style.zIndex = '9999';
createSessionButton.style.backgroundColor = 'red';
createSessionButton.style.color = 'white';
createSessionButton.style.padding = '10px';

console.log('Force session button added to page');