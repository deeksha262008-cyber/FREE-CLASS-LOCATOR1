// Embedded Dataset
const timetableData = [
  {
    "room": "IST 509",
    "floor": "Ground",
    "hasAC": true,
    "nextOccupiedTime": "14:30", // For countdown calculations
    "schedule": [
      { "time": "09:00 - 11:00", "subject": "Biology" },
      { "time": "11:00 - 14:30", "subject": "FREE" },
      { "time": "14:30 - 17:00", "subject": "Chemistry" }
    ]
  },
  {
    "room": "G-102",
    "floor": "Ground",
    "hasAC": false,
    "nextOccupiedTime": "13:00",
    "schedule": [
      { "time": "09:00 - 12:00", "subject": "FREE" },
      { "time": "12:00 - 15:00", "subject": "Physics" }
    ]
  },
  {
    "room": "F-201",
    "floor": "First",
    "hasAC": true,
    "nextOccupiedTime": "16:00",
    "schedule": [
      { "time": "09:00 - 13:00", "subject": "FREE" },
      { "time": "13:00 - 14:00", "subject": "English" }
    ]
  }
];

let countdownInterval = null;
let activeSelectedRoom = null;

document.addEventListener("DOMContentLoaded", () => {
  renderMap(timetableData);
  renderGrid(timetableData);
});

// Helper: Convert "HH:MM" to minutes
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Get Current Time String (HH:MM)
function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

// Determine if room is free right now
function getRoomStatus(room) {
  const currentMins = timeToMinutes(getCurrentTimeString());

  for (const slot of room.schedule) {
    const [startStr, endStr] = slot.time.split(' - ');
    const slotStart = timeToMinutes(startStr);
    const slotEnd = timeToMinutes(endStr);

    if (currentMins >= slotStart && currentMins < slotEnd) {
      return slot.subject === "FREE" ? "FREE" : "BUSY";
    }
  }
  return "FREE";
}

// Render Interactive 3D/Visual Map Nodes
function renderMap(data) {
  const mapContainer = document.getElementById('visualMapContainer');
  mapContainer.innerHTML = '';

  data.forEach(room => {
    const status = getRoomStatus(room);
    const node = document.createElement('div');
    node.className = `map-node ${status.toLowerCase()}`;
    node.innerHTML = `
      <div><strong>${room.room}</strong></div>
      <div style="font-size: 0.75rem; margin-top: 4px;">${status}</div>
    `;
    node.addEventListener('click', () => selectRoomForDetail(room));
    mapContainer.appendChild(node);
  });
}

// Handle Room Selection (Triggers Countdown & WhatsApp button)
function selectRoomForDetail(room) {
  activeSelectedRoom = room;
  const status = getRoomStatus(room);
  const detailCard = document.getElementById('roomDetailCard');
  
  detailCard.classList.remove('hidden');
  document.getElementById('detailRoomTitle').textContent = `Selected: ${room.room}`;
  document.getElementById('detailRoomStatus').textContent = `Status: ${status}`;
  document.getElementById('detailRoomStatus').style.color = status === 'FREE' ? '#2dc653' : '#a4133c';

  startCountdown(room.nextOccupiedTime);
}

// Live Countdown Timer Implementation
function startCountdown(targetTimeStr) {
  if (countdownInterval) clearInterval(countdownInterval);

  const display = document.getElementById('countdownDisplay');

  countdownInterval = setInterval(() => {
    const now = new Date();
    const [targetHours, targetMins] = targetTimeStr.split(':').map(Number);
    
    const targetDate = new Date();
    targetDate.setHours(targetHours, targetMins, 0, 0);

    const diffMs = targetDate - now;

    if (diffMs <= 0) {
      clearInterval(countdownInterval);
      display.textContent = "Time Expired / Class Started";
      return;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

    display.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, 1000);
}

// "Call the Squad" WhatsApp Feature
document.getElementById('squadShareBtn').addEventListener('click', () => {
  if (!activeSelectedRoom) return;

  const roomName = activeSelectedRoom.room;
  const freeUntil = activeSelectedRoom.nextOccupiedTime;

  // Format exact message requested
  const message = `📍 Heading to ${roomName}. It's free until ${freeUntil}. Come fast!`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(whatsappUrl, '_blank');
});

// Render Standard Floor View
function renderGrid(data) {
  const gridContainer = document.getElementById('gridContainer');
  gridContainer.innerHTML = '';

  const floors = [...new Set(data.map(item => item.floor))];

  floors.forEach(floor => {
    const floorSection = document.createElement('div');
    floorSection.className = 'card';

    const floorTitle = document.createElement('h3');
    floorTitle.style.marginBottom = '10px';
    floorTitle.textContent = `${floor} Floor`;
    floorSection.appendChild(floorTitle);

    const roomsGrid = document.createElement('div');
    roomsGrid.className = 'rooms-grid';

    const floorRooms = data.filter(r => r.floor === floor);

    floorRooms.forEach(room => {
      const status = getRoomStatus(room);
      const card = document.createElement('div');
      card.className = 'room-card';
      card.innerHTML = `
        <div class="room-header">
          <span>${room.room}</span>
          <span class="badge ${status.toLowerCase()}">${status}</span>
        </div>
        <div class="room-details">
          <p>AC: ${room.hasAC ? 'Yes' : 'No'}</p>
        </div>
      `;
      roomsGrid.appendChild(card);
    });

    floorSection.appendChild(roomsGrid);
    gridContainer.appendChild(floorSection);
  });
}

// Normal Filters
document.getElementById('filterBtn').addEventListener('click', () => {
  const selectedFloor = document.getElementById('floorSelect').value;
  const selectedAC = document.getElementById('acSelect').value;

  const filtered = timetableData.filter(room => {
    const matchesFloor = selectedFloor === 'All' || room.floor === selectedFloor;
    const matchesAC = selectedAC === 'Any' || (selectedAC === 'Yes' ? room.hasAC : !room.hasAC);
    return matchesFloor && matchesAC;
  });

  renderMap(filtered);
  renderGrid(filtered);
});

// Smart Search
document.getElementById('smartSearchBtn').addEventListener('click', () => {
  const query = document.getElementById('smartSearchInput').value.toLowerCase();
  
  let floor = 'All';
  let hasAC = 'Any';

  if (query.includes('ground')) floor = 'Ground';
  if (query.includes('first')) floor = 'First';
  if (query.includes('ac')) hasAC = 'Yes';

  document.getElementById('smartResults').innerHTML = `
    Extracted filters: <b>Floor:</b> ${floor} | <b>AC:</b> ${hasAC}
  `;

  const filtered = timetableData.filter(room => {
    const matchesFloor = floor === 'All' || room.floor === floor;
    const matchesAC = hasAC === 'Any' || (hasAC === 'Yes' ? room.hasAC : !room.hasAC);
    return matchesFloor && matchesAC;
  });

  renderMap(filtered);
  renderGrid(filtered);
});