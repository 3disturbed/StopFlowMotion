const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const captureButton = document.getElementById('capture');
const opacitySlider = document.getElementById('opacity');
const previewButton = document.getElementById('previewAnimation');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const animationCanvas = document.getElementById('animationCanvas');
const animationContext = animationCanvas.getContext('2d');
const timeline = document.getElementById('timeline');

let capturedFrames = [];
let frameDurations = [];
let animationInterval;
let currentFrameIndex = 0;

// Access the webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    console.error("Error accessing webcam: ", err);
  });

// Draw the live video feed onto the canvas
video.addEventListener('play', function() {
  drawFrame();
});

function drawFrame() {
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Overlay the last captured frame if it exists
  if (capturedFrames.length) {
    context.globalAlpha = opacitySlider.value;
    context.drawImage(capturedFrames[capturedFrames.length - 1], 0, 0, canvas.width, canvas.height);
    context.globalAlpha = 1.0;
  }

  requestAnimationFrame(drawFrame);
}

// Capture the current frame from the canvas
captureButton.addEventListener('click', function() {
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  let frameImage = new Image();
  frameImage.src = canvas.toDataURL('image/png');
  capturedFrames.push(frameImage);
  frameDurations.push(100); // Default duration
  updateTimeline();
});

function updateTimeline() {
  timeline.innerHTML = '';
  capturedFrames.forEach((frame, index) => {
    const thumbnail = document.createElement('div');
    thumbnail.classList.add('thumbnail');
    thumbnail.innerHTML = `
      <img width="320px" height="240px" src="${frame.src}"><div><button class="shift-left" data-index="${index}"><<</button>
      <button  class="delete"  data-index="${index}">&times;</button>
      <button  class="blend" data-index="${index}">Blend</button>

      <input type="number" value="${frameDurations[index]}" min="50" class="frame-duration" data-index="${index}">
      <button class="download" data-index="${index}">Save</button><button class="duplicate" data-index="${index}">Clone</button>
      
      <button class="shift-right" data-index="${index}">>></button>
     
    `;
    timeline.appendChild(thumbnail);
  });
}
// Timeline actions (Delete, Blend, Download, Shift, and Duplicate)
timeline.addEventListener('click', function(e) {
  const index = parseInt(e.target.dataset.index);

  if (e.target.classList.contains('delete')) {
    // Delete the frame
    capturedFrames.splice(index, 1);
    frameDurations.splice(index, 1);
    updateTimeline();
  } else if (e.target.classList.contains('blend')) {
    // Blend frame with the next one
    if (index < capturedFrames.length - 1) {
      const blendedFrame = createBlendedFrame(capturedFrames[index], capturedFrames[index + 1]);
      capturedFrames.splice(index + 1, 0, blendedFrame);
      frameDurations.splice(index + 1, 0, 100); // Default duration
      updateTimeline();
    } else {
      alert("Cannot blend the last frame.");
    }
  } else if (e.target.classList.contains('download')) {
    // Download the frame as an image
    const frame = capturedFrames[index];
    const link = document.createElement('a');
    link.href = frame.src;
    link.download = `frame_${index + 1}.png`;
    link.click();
  } else if (e.target.classList.contains('shift-left')) {
    // Shift frame left
    if (index > 0) {
      [capturedFrames[index], capturedFrames[index - 1]] = [capturedFrames[index - 1], capturedFrames[index]];
      [frameDurations[index], frameDurations[index - 1]] = [frameDurations[index - 1], frameDurations[index]];
      updateTimeline();
    }
  } else if (e.target.classList.contains('shift-right')) {
    // Shift frame right
    if (index < capturedFrames.length - 1) {
      [capturedFrames[index], capturedFrames[index + 1]] = [capturedFrames[index + 1], capturedFrames[index]];
      [frameDurations[index], frameDurations[index + 1]] = [frameDurations[index + 1], frameDurations[index]];
      updateTimeline();
    }
  } else if (e.target.classList.contains('duplicate')) {
    // Duplicate the frame
    const duplicateFrame = new Image();
    duplicateFrame.src = capturedFrames[index].src;
    capturedFrames.splice(index + 1, 0, duplicateFrame);
    frameDurations.splice(index + 1, 0, frameDurations[index]); // Duplicate duration as well
    updateTimeline();
  }
});

// Preview Animation Modal
previewButton.addEventListener('click', function() {
  if (capturedFrames.length === 0) {
    alert("No frames captured for animation.");
    return;
  }
  modal.style.display = 'flex';
  playAnimation();
});

closeModal.addEventListener('click', function() {
  modal.style.display = 'none';
  clearInterval(animationInterval);
  currentFrameIndex = 0;
});

// Play animation in the modal
function playAnimation() {
  animationInterval = setInterval(() => {
    animationContext.clearRect(0, 0, animationCanvas.width, animationCanvas.height);
    animationContext.drawImage(capturedFrames[currentFrameIndex], 0, 0, animationCanvas.width, animationCanvas.height);
    
    currentFrameIndex = (currentFrameIndex + 1) % capturedFrames.length;
  }, frameDurations[currentFrameIndex]);
}

// Apply Global Playback Speed
document.getElementById('applyGlobalSpeed').addEventListener('click', function() {
  const speed = parseInt(document.getElementById('globalSpeed').value, 10);
  if (!isNaN(speed) && speed > 0) {
    frameDurations = frameDurations.map(() => speed);
    alert('Global playback speed applied!');
  } else {
    alert('Please enter a valid speed in milliseconds.');
  }
});

// Delete or Blend Frames in Timeline
timeline.addEventListener('click', function(e) {
  const index = parseInt(e.target.dataset.index);
  
  if (e.target.classList.contains('delete')) {
    // Delete the frame
    capturedFrames.splice(index, 1);
    frameDurations.splice(index, 1);
    updateTimeline();
  } else if (e.target.classList.contains('blend')) {
    // Blend frame with the next one
    if (index < capturedFrames.length - 1) {
      const blendedFrame = createBlendedFrame(capturedFrames[index], capturedFrames[index + 1]);
      capturedFrames.splice(index + 1, 0, blendedFrame);
      frameDurations.splice(index + 1, 0, 100); // Default duration
      updateTimeline();
    } else {
      alert("Cannot blend the last frame.");
    }
  }
});

// Adjust Frame Duration Directly
timeline.addEventListener('input', function(e) {
  if (e.target.classList.contains('frame-duration')) {
    const index = parseInt(e.target.dataset.index);
    frameDurations[index] = parseInt(e.target.value);
  }
});

// Function to blend two frames
function createBlendedFrame(frame1, frame2) {
  const blendedCanvas = document.createElement('canvas');
  blendedCanvas.width = frame1.width;
  blendedCanvas.height = frame1.height;
  const blendedContext = blendedCanvas.getContext('2d');

  blendedContext.drawImage(frame1, 0, 0, blendedCanvas.width, blendedCanvas.height);
  blendedContext.globalAlpha = 0.5;
  blendedContext.drawImage(frame2, 0, 0, blendedCanvas.width, blendedCanvas.height);
  blendedContext.globalAlpha = 1.0;

  const blendedImage = new Image();
  blendedImage.src = blendedCanvas.toDataURL('image/png');


  return blendedImage;
}

// Save Frames to Local Storage
function saveToLocalStorage() {
  const framesData = capturedFrames.map(frame => frame.src);
  const data = { frames: framesData, durations: frameDurations };
  localStorage.setItem('animationData', JSON.stringify(data));
  alert('Animation saved to local storage!');
}

document.getElementById('saveAnimation').addEventListener('click', saveToLocalStorage);

// Load Frames from Local Storage
function loadFromLocalStorage() {
  const data = JSON.parse(localStorage.getItem('animationData'));
  if (data) {
    capturedFrames = data.frames.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });
    frameDurations = data.durations;
    updateTimeline();
    alert('Animation loaded from local storage!');
  } else {
    alert('No animation data found in local storage.');
  }
}

document.getElementById('loadAnimation').addEventListener('click', loadFromLocalStorage);

// Import Frames Before or After Current Frames
function importFrames(position = 'after') {
  const data = JSON.parse(localStorage.getItem('animationData'));
  if (data) {
    const importedFrames = data.frames.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });
    const importedDurations = data.durations;

    if (position === 'before') {
      capturedFrames = [...importedFrames, ...capturedFrames];
      frameDurations = [...importedDurations, ...frameDurations];
    } else {
      capturedFrames = [...capturedFrames, ...importedFrames];
      frameDurations = [...frameDurations, ...importedDurations];
    }
    updateTimeline();
    alert(`Frames imported ${position} current frames.`);
  } else {
    alert('No animation data found in local storage.');
  }
}

document.getElementById('importBefore').addEventListener('click', () => importFrames('before'));
document.getElementById('importAfter').addEventListener('click', () => importFrames('after'));

// Upload Frames from File Input
document.getElementById('uploadFrames').addEventListener('change', function(event) {
  const files = Array.from(event.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.src = e.target.result;
      capturedFrames.push(img);
      frameDurations.push(100); // Default duration
      updateTimeline();
    };
    reader.readAsDataURL(file);
  });
  event.target.value = ''; // Reset file input
});
  modal.style.display = 'none';