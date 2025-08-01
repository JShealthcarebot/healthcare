
function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}
function goMenu() {
  window.location.href = 'main.html';
}
