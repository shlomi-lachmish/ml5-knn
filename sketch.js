let video;
let currentEle;
// Create a KNN classifier
const knnClassifier = ml5.KNNClassifier();
let featureExtractor;

function setup() {
  // Create a featureExtractor that can extract the already learned features from MobileNet
  featureExtractor = ml5.featureExtractor("MobileNet", () => {
    select("#status").html("MobileNet model is Loaded");
  });

  noCanvas();
  // Create a video element
  video = createCapture(VIDEO);
  // Append it to the videoContainer DOM element
  video.parent("videoContainer");
  // Create the UI buttons
  createButtons();
  createDiv("")
    .id("create-container")
    .parent("add-features");
  let addFeature = createButton("Add Feature")
    .parent("create-container")
    .addClass("fd-button")
    .addClass("btn");
  let newFeature = createInput()
    .parent("create-container")
    .id("input-feature");

  addFeature.mousePressed(e => {
    let newFeatureStr = select("#input-feature").value();
    select("#input-feature").value("");
    createFeature(newFeatureStr);
  });
}
function keyPressed(keyCode) {
  if (
    keyCode.code == "Enter" &&
    document.activeElement.id === "input-feature"
  ) {
    let newFeatureStr = select("#input-feature").value();
    select("#input-feature").value("");
    createFeature(newFeatureStr);
  }
}

function updateCounter(eleId, isReset) {
  let ele = select("#" + eleId);
  if (isReset) {
    ele.html(ele.html().split(": ")[0] + ": 0");
  } else {
    currentEle = ele;
    let counter = 1 + parseInt(ele.html().split(": ")[1]);
    ele.html(ele.html().split(": ")[0] + ": " + counter);
  }
  return null;
}
function createFeature(name) {
  currentEle = select(`#feature-${name}`);
  if (!select(`#feature-${name}`) && name) {
    let newDiv = createDiv(`<h1 class="feature-header">${name}</h1>`);
    newDiv.id(`feature-${name}`);
    newDiv.addClass(name).addClass("feature-container");
    newDiv.parent("features");
    let newAddButton = createButton("Add Pic: 0");
    newAddButton.id(`btnAdd-${name}`).addClass("fd-button");
    newAddButton.parent(newDiv);
    newAddButton.mousePressed(e => {
      if (e.type === "mousedown") {
        addExample(e.target.id.split("-")[1]);
        updateCounter(e.srcElement.id, false);
      }
    });
    let newResetButton = createButton("Reset");
    newResetButton.id(`btnReset-${name}`).addClass("fd-button");
    newResetButton.parent(newDiv);
    newResetButton.mousePressed(e => {
      if (e.type === "mousedown") {
        clearLabel(e.target.id.split("-")[1]);
        addPic = select(`#btnAdd-${e.target.id.split("-")[1]}`);
        updateCounter(addPic.id(), true);
      }
    });
  }
}
// Add the current frame from the video to the classifier
function addExample(label) {
  // Get the features of the input video
  const features = featureExtractor.infer(video);
  // You can also pass in an optional endpoint, defaut to 'conv_preds'
  // const features = featureExtractor.infer(video, 'conv_preds');
  // You can list all the endpoints by calling the following function
  // console.log("All endpoints: ", featureExtractor.mobilenet.endpoints);

  // Add an example with a label to the classifier
  knnClassifier.addExample(features, label);
  //updateCounts();
}

// Predict the current frame.
function classify(e) {
  if (e.type === "mousedown" || e.type === "continue") {
    // Get the total number of labels from knnClassifier
    const numLabels = knnClassifier.getNumLabels();
    if (numLabels <= 0) {
      console.error("There is no examples in any label");
      return;
    }

    // Get the features of the input video
    const features = featureExtractor.infer(video);

    // Use knnClassifier to classify which label do these features belong to
    // You can pass in a callback function `gotResults` to knnClassifier.classify function
    knnClassifier.classify(features, gotResults);
    // You can also pass in an optional K value, K default to 3
    // knnClassifier.classify(features, 3, gotResults);

    // You can also use the following async/await function to call knnClassifier.classify
    // Remember to add `async` before `function predictClass()`
    // const res = await knnClassifier.classify(features);
    // gotResults(null, res);
  }
}

// A util function to create UI buttons
function createButtons() {
  // Predict button
  buttonPredict = select("#buttonPredict");
  buttonPredict.mousePressed(classify);

  // Clear all classes button
  buttonClearAll = select("#clearAll");
  buttonClearAll.mousePressed(clearAllLabels);

  // Load saved classifier dataset
  buttonSetData = select("#load");
  buttonSetData.mousePressed(loadMyKNN).hide();

  // Get classifier dataset
  buttonGetData = select("#save");
  buttonGetData.mousePressed(saveMyKNN);
}

// Show the results
function gotResults(err, result) {
  if (result) {
    // Display any error
    if (err) {
      console.error(err);
    }

    if (result.confidencesByLabel) {
      const confidences = result.confidencesByLabel;
      // result.label is the label that has the highest confidence
      if (result.label) {
        select("#result").html(result.label);
        select("#confidence").html(`${confidences[result.label] * 100} %`);
        setLabelSelected(result.label, confidences[result.label] * 100);
      }

      // select("#confidenceRock").html(
      //   `${confidences["Rock"] ? confidences["Rock"] * 100 : 0} %`
      // );
      // select("#confidencePaper").html(
      //   `${confidences["Paper"] ? confidences["Paper"] * 100 : 0} %`
      // );
      // select("#confidenceScissor").html(
      //   `${confidences["Scissor"] ? confidences["Scissor"] * 100 : 0} %`
      // );
    }
    classify({ type: "continue" });
  }
}
function setLabelSelected(label, conf) {
  document.querySelectorAll(".feature-container").forEach(function(el) {
    el.classList.remove("mark-feature");
  });

  let featureEle = select(`#feature-${label}`);
  featureEle.addClass("mark-feature");
}
// Update the example count for each label
function updateCounts() {
  const counts = knnClassifier.getCountByLabel();
  labelsArr = Object.keys(counts);
  labelsArr.map(label => {
    updateCounter(`#btnAdd-${label}`, true);
  });
}

// Clear the examples in one label
function clearLabel(label) {
  knnClassifier.clearLabel(label);
}

// Clear all the examples in all labels
function clearAllLabels() {
  knnClassifier.clearAllLabels();
  var featuresElement = document.getElementById("features");
  while (featuresElement.firstChild) {
    featuresElement.removeChild(featuresElement.firstChild);
  }

  updateCounts();
}

// Save dataset as myKNNDataset.json
function saveMyKNN() {
  knnClassifier.save("myKNNDataset");
}

// Load dataset to the classifier
function loadMyKNN() {
  knnClassifier.load("./myKNNDataset.json", updateCounts);
}
