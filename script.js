/* ==========================================================================
   North Star Bakery - script.js (Touchstone 4)

   1. Pre-Order List (products.html): visitors add bakery items to a list.
      The list is saved in localStorage.
   2. Pre-filled request (contact.html): the saved list fills in the
      "Item details" box.
   3. Form validation (contact.html): checks each field and shows an error
      message next to it. The form will not submit until everything is valid.
   4. Remember me (contact.html): optionally remembers name and email.
   ========================================================================== */

'use strict';

/* ---------------------------------------------------------------------------
   DATA
   --------------------------------------------------------------------------- */

// Object: the names used to save things in localStorage
const STORAGE_KEYS = {
  preorderList: 'northStarBakery.preorderList',
  contactInfo: 'northStarBakery.contactInfo'
};

// How many days from today the earliest pickup date can be
const MIN_DAYS_AHEAD = 2;

// Array: the visitor's pre-order list. Each item is an object like
// { id: 'seeded-multigrain', name: 'Seeded Multigrain', category: 'Breads' }
let preorderList = [];

// Array of objects: the rules for each form field
const formFields = [
  { id: 'customer-name', label: 'full name', required: true, minLength: 2, maxLength: 60 },
  { id: 'customer-email', label: 'email address', required: true, type: 'email' },
  { id: 'customer-phone', label: 'phone number', required: false, type: 'phone' },
  { id: 'request-type', label: 'request type', required: true },
  { id: 'pickup-date', label: 'pickup date', required: true, type: 'date' },
  { id: 'item-details', label: 'item details', required: true, minLength: 10, maxLength: 500 },
  { id: 'allergy-notes', label: 'allergy notes', required: false, maxLength: 300 }
];

/* ---------------------------------------------------------------------------
   LOCAL STORAGE HELPERS
   localStorage only saves text, so arrays and objects are converted with
   JSON.stringify (save) and JSON.parse (load). try/catch keeps the site
   working if the browser blocks storage.
   --------------------------------------------------------------------------- */

function loadFromStorage(key, fallback) {
  try {
    const savedText = localStorage.getItem(key);
    if (savedText === null) {
      return fallback;
    }
    return JSON.parse(savedText);
  } catch (error) {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage is blocked, so just skip saving
  }
}

function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // Storage is blocked, so there is nothing to remove
  }
}

/* ---------------------------------------------------------------------------
   PRE-ORDER LIST (data)
   --------------------------------------------------------------------------- */

function loadPreorderList() {
  const savedList = loadFromStorage(STORAGE_KEYS.preorderList, []);
  if (Array.isArray(savedList)) {
    return savedList;
  }
  return [];
}

function savePreorderList() {
  saveToStorage(STORAGE_KEYS.preorderList, preorderList);
}

function isInList(id) {
  for (let i = 0; i < preorderList.length; i++) {
    if (preorderList[i].id === id) {
      return true;
    }
  }
  return false;
}

function addToList(product) {
  if (!isInList(product.id)) {
    preorderList.push(product);
  }
}

function removeFromList(id) {
  // filter() keeps every item except the one with this id
  preorderList = preorderList.filter(function (item) {
    return item.id !== id;
  });
}

// Turn the list into text for the "Item details" box, one item per line
function listToText() {
  const lines = preorderList.map(function (item) {
    return '1 x ' + item.name + ' (' + item.category + ')';
  });
  return lines.join('\n');
}

/* ---------------------------------------------------------------------------
   PRODUCTS PAGE
   --------------------------------------------------------------------------- */

// Make each "Add to my list" button say "Add" or "Remove" to match the list
function updateProductButtons() {
  const buttons = document.querySelectorAll('.add-to-list');

  buttons.forEach(function (button) {
    const name = button.dataset.name;

    if (isInList(button.dataset.id)) {
      button.textContent = 'Remove from my list';
      button.setAttribute('aria-label', 'Remove ' + name + ' from my pre-order list');
      button.classList.add('is-added');
    } else {
      button.textContent = 'Add to my list';
      button.setAttribute('aria-label', 'Add ' + name + ' to my pre-order list');
      button.classList.remove('is-added');
    }
  });
}

// Draw the list panel from the preorderList array
function showPreorderList() {
  const listElement = document.getElementById('list-items');
  const status = document.getElementById('list-status');
  const continueLink = document.getElementById('list-continue');
  const clearButton = document.getElementById('list-clear');

  listElement.innerHTML = '';

  if (preorderList.length === 0) {
    status.textContent = 'Your list is empty. Choose "Add to my list" on any item below to start.';
    continueLink.hidden = true;
    clearButton.hidden = true;
    return;
  }

  status.textContent = 'You have ' + preorderList.length + ' item(s) on your list. It is saved on this device.';
  continueLink.hidden = false;
  clearButton.hidden = false;

  preorderList.forEach(function (item) {
    const listItem = document.createElement('li');
    listItem.className = 'list-item';

    const text = document.createElement('span');
    text.textContent = item.name + ' (' + item.category + ')';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'link-button';
    removeButton.textContent = 'Remove';
    removeButton.setAttribute('aria-label', 'Remove ' + item.name + ' from my list');
    removeButton.addEventListener('click', function () {
      removeFromList(item.id);
      updateProductsPage();
    });

    listItem.appendChild(text);
    listItem.appendChild(removeButton);
    listElement.appendChild(listItem);
  });
}

// After any change: save the list, then redraw the page
function updateProductsPage() {
  savePreorderList();
  showPreorderList();
  updateProductButtons();
}

function handleAddButtonClick(event) {
  const button = event.currentTarget;
  const id = button.dataset.id;

  if (isInList(id)) {
    removeFromList(id);
  } else {
    addToList({
      id: id,
      name: button.dataset.name,
      category: button.dataset.category
    });
  }
  updateProductsPage();
}

function handleClearClick() {
  preorderList = [];
  updateProductsPage();
}

function setupProductsPage() {
  const buttons = document.querySelectorAll('.add-to-list');
  buttons.forEach(function (button) {
    button.addEventListener('click', handleAddButtonClick);
  });
  document.getElementById('list-clear').addEventListener('click', handleClearClick);
  updateProductsPage();
}

/* ---------------------------------------------------------------------------
   CONTACT PAGE: PRE-FILL AND REMEMBER
   --------------------------------------------------------------------------- */

// Fill "Item details" from the saved list (only if the box is empty)
function prefillFromList() {
  const itemDetails = document.getElementById('item-details');

  if (preorderList.length === 0 || itemDetails.value.trim() !== '') {
    return;
  }
  itemDetails.value = listToText();
  document.getElementById('request-type').value = 'pre-order';
  document.getElementById('prefill-note').hidden = false;
}

// Fill name and email if the visitor asked us to remember them
function loadRememberedContact() {
  const saved = loadFromStorage(STORAGE_KEYS.contactInfo, null);

  if (saved === null) {
    return;
  }
  document.getElementById('customer-name').value = saved.name;
  document.getElementById('customer-email').value = saved.email;
  document.getElementById('remember-me').checked = true;
}

// Save name and email if the box is checked, otherwise forget them
function updateRememberedContact() {
  if (document.getElementById('remember-me').checked) {
    saveToStorage(STORAGE_KEYS.contactInfo, {
      name: document.getElementById('customer-name').value.trim(),
      email: document.getElementById('customer-email').value.trim()
    });
  } else {
    removeFromStorage(STORAGE_KEYS.contactInfo);
  }
}

/* ---------------------------------------------------------------------------
   FORM VALIDATION
   The form has the "novalidate" attribute, so these functions do the
   checking and show the messages instead of the browser's pop-ups.
   --------------------------------------------------------------------------- */

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isValidPhone(value) {
  return /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/.test(value);
}

// The earliest pickup date: today plus MIN_DAYS_AHEAD days
function getEarliestDate() {
  const earliest = new Date();
  earliest.setDate(earliest.getDate() + MIN_DAYS_AHEAD);
  return earliest;
}

// Turn a Date into "YYYY-MM-DD", the format a date input uses
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

// Check one field. Returns an error message, or '' if the field is fine.
function getErrorMessage(rules, value) {
  const text = value.trim();

  // Check 1: required field
  if (text === '') {
    if (rules.required) {
      return 'The ' + rules.label + ' is required.';
    }
    return '';
  }

  // Check 2: minimum length
  if (rules.minLength && text.length < rules.minLength) {
    return 'The ' + rules.label + ' must be at least ' + rules.minLength + ' characters (you have ' + text.length + ').';
  }

  // Check 3: maximum length
  if (rules.maxLength && text.length > rules.maxLength) {
    return 'The ' + rules.label + ' must be ' + rules.maxLength + ' characters or fewer (you have ' + text.length + ').';
  }

  // Check 4: email format
  if (rules.type === 'email' && !isValidEmail(text)) {
    return 'Please enter a valid email address, like name@example.com.';
  }

  // Check 5: phone format
  if (rules.type === 'phone' && !isValidPhone(text)) {
    return 'Please use the phone format 555-010-2030, or leave this blank.';
  }

  // Check 6: pickup date must be far enough ahead
  if (rules.type === 'date' && text < formatDate(getEarliestDate())) {
    const earliestText = getEarliestDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    return 'Please choose ' + earliestText + ' or later. We need at least ' + MIN_DAYS_AHEAD + ' days of notice.';
  }

  return '';
}

// Show (or clear) the message next to a field
function showError(input, message) {
  const errorElement = document.getElementById(input.id + '-error');
  errorElement.textContent = message;

  if (message === '') {
    input.removeAttribute('aria-invalid');
  } else {
    input.setAttribute('aria-invalid', 'true');
  }
}

// Check one field and show its message. Returns true if the field is valid.
function validateField(rules) {
  const input = document.getElementById(rules.id);
  const message = getErrorMessage(rules, input.value);
  showError(input, message);
  return message === '';
}

// Check every field. Returns a list of the ids that have errors.
function validateForm() {
  const invalidIds = [];

  formFields.forEach(function (rules) {
    if (!validateField(rules)) {
      invalidIds.push(rules.id);
    }
  });
  return invalidIds;
}

function showFormStatus(message, isError) {
  const status = document.getElementById('form-status');
  status.textContent = message;
  status.classList.toggle('is-error', isError);
  status.hidden = false;
}

// Runs when the visitor clicks "Send Request"
function handleFormSubmit(event) {
  event.preventDefault(); // stop the form from sending until it is valid

  const invalidIds = validateForm();

  if (invalidIds.length > 0) {
    showFormStatus('Please fix the ' + invalidIds.length + ' field(s) marked below, then send again. Your answers have been kept.', true);
    document.getElementById(invalidIds[0]).focus();
    return;
  }

  // The form is valid
  updateRememberedContact();
  const firstName = document.getElementById('customer-name').value.trim().split(' ')[0];
  const email = document.getElementById('customer-email').value.trim();

  showFormStatus('Thank you, ' + firstName + '! We received your request and will email ' + email +
    ' within one business day. (This is a practice site, so no real email is sent.)', false);

  // Start fresh: clear the list and the form
  preorderList = [];
  savePreorderList();
  document.getElementById('request-form').reset();
  formFields.forEach(function (rules) {
    showError(document.getElementById(rules.id), '');
  });
  document.getElementById('prefill-note').hidden = true;
  loadRememberedContact();
}

// Set up the form: checks when leaving a field, and live fixing while typing
function setupFieldChecks() {
  formFields.forEach(function (rules) {
    const input = document.getElementById(rules.id);

    // Check the field when the visitor leaves it
    input.addEventListener('blur', function () {
      validateField(rules);
    });

    // If the field already shows an error, re-check as they type
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true') {
        validateField(rules);
      }
    });
  });
}

function setupContactPage() {
  document.getElementById('pickup-date').min = formatDate(getEarliestDate());

  loadRememberedContact();
  prefillFromList();
  setupFieldChecks();
  document.getElementById('request-form').addEventListener('submit', handleFormSubmit);
}

/* ---------------------------------------------------------------------------
   START-UP
   The same script loads on every page, so look for an element that only
   one page has to decide what to set up.
   --------------------------------------------------------------------------- */

function init() {
  preorderList = loadPreorderList();

  if (document.getElementById('list-items')) {
    setupProductsPage();
  }
  if (document.getElementById('request-form')) {
    setupContactPage();
  }
}

document.addEventListener('DOMContentLoaded', init);
