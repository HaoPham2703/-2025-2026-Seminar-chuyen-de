// State
let isClockedIn = false;
let clockInTime = null;
let timerInterval = null;

// DOM Elements
const currentTimeEl = document.getElementById('currentTime');
const currentDateEl = document.getElementById('currentDate');
const clockButton = document.getElementById('clockButton');
const clockText = document.getElementById('clockText');
const swipeHint = document.getElementById('swipeHint');
const workingHoursEl = document.getElementById('workingHours');
const confirmModal = document.getElementById('confirmModal');
const modalTime = document.getElementById('modalTime');
const notification = document.getElementById('notification');
const notificationIcon = document.getElementById('notificationIcon');
const notificationTitle = document.getElementById('notificationTitle');
const notificationTime = document.getElementById('notificationTime');

// Format time (HH:MM)
function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Format date
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

// Update current time display
function updateCurrentTime() {
  const now = new Date();
  currentTimeEl.textContent = formatTime(now);
  currentDateEl.textContent = formatDate(now);
}

// Calculate working hours
function getWorkingHours() {
  if (!clockInTime) return '00:00';
  
  const now = new Date();
  const diff = now.getTime() - clockInTime.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Update working hours display
function updateWorkingHours() {
  workingHoursEl.textContent = getWorkingHours();
  modalTime.textContent = getWorkingHours();
}

// Show notification
function showNotification(type, time) {
  if (type === 'success') {
    notificationIcon.classList.remove('late');
    notificationTitle.textContent = 'On Time!';
  } else {
    notificationIcon.classList.add('late');
    notificationTitle.textContent = 'You\'re Late!';
  }
  
  notificationTime.textContent = `Clocked in at ${time}`;
  notification.classList.add('active');
  
  setTimeout(() => {
    notification.classList.remove('active');
  }, 3000);
}

// Handle clock action
function handleClockAction() {
  if (isClockedIn) {
    // Show confirm modal
    confirmModal.classList.add('active');
  } else {
    // Clock In
    const now = new Date();
    clockInTime = now;
    isClockedIn = true;
    
    // Update UI
    clockButton.classList.add('clocked-in');
    clockText.textContent = 'Clock Out';
    swipeHint.textContent = 'Tap to Clock Out';
    
    // Check if on time (before 9:00 AM)
    const isOnTime = now.getHours() < 9 || (now.getHours() === 9 && now.getMinutes() === 0);
    showNotification(isOnTime ? 'success' : 'late', formatTime(now));
    
    // Start timer
    timerInterval = setInterval(updateWorkingHours, 1000);
    updateWorkingHours();
  }
}

// Close modal
function closeModal() {
  confirmModal.classList.remove('active');
}

// Confirm clock out
function confirmClockOut() {
  isClockedIn = false;
  clockInTime = null;
  
  // Update UI
  clockButton.classList.remove('clocked-in');
  clockText.textContent = 'Clock In';
  swipeHint.textContent = 'Tap the button to Clock In';
  workingHoursEl.textContent = '00:00';
  
  // Stop timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  closeModal();
}

// Initialize
function init() {
  // Update time every second
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
  
  // Close modal on overlay click
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
      closeModal();
    }
  });
}

// Start app
init();

