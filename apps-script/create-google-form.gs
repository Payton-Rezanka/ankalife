/**
 * AnkaLife — auto-build the Google Form version of your survey.
 * ============================================================
 * HOW TO USE (non-technical, ~3 minutes):
 *   1. Go to script.google.com → New project.
 *   2. Delete the sample code, paste ALL of this in, click 💾 Save.
 *   3. Function dropdown at top = "createSurveyForm" → click ▶ Run.
 *   4. Approve the permission prompt (it's your script building your own form).
 *   5. Click "Execution log" at the bottom — it prints THREE links:
 *        • PUBLIC form link  → this is what goes on your flyer/QR/social
 *        • EDIT form link    → to tweak questions/branding later
 *        • RESPONSES sheet    → every person who fills it out lands here (your full-access view)
 *   6. Connect Excel to the RESPONSES sheet with the Power Query steps in EXCEL_LEADS_SETUP.md.
 *
 * Re-running makes a NEW form each time — only run it once.
 *
 * NOTE: when you Run it, Google will ask permission to (a) build the form, (b) create a
 * spreadsheet, and (c) SEND YOU EMAIL when a lead comes in — approve all of it. That's how
 * you get notified.
 */

// 📧 Every new survey response emails this address (with the lead's name, phone & answers).
//    Change it anytime if you want notifications somewhere else.
const NOTIFY_EMAIL = 'ptrezankaffl@outlook.com';

function createSurveyForm() {
  const form = FormApp.create('AnkaLife — Free Life Insurance Quote');

  form.setDescription(
    'Protecting the people you love is one of the most important things you can do. ' +
    'Answer a few quick questions (about 5 minutes) and a licensed agent will follow up with ' +
    'options that fit you — free, no pressure, no obligation. This is a quick request, not an ' +
    'instant quote; coverage and pricing depend on your application.'
  );
  form.setProgressBar(true);
  form.setConfirmationMessage(
    'Thank you — your request is in! A licensed agent will reach out to you soon to go over your ' +
    'options. (This was not an instant quote.) Watch for our call, even from an unknown number.'
  );

  // --- Contact (so you can call them) ---
  form.addTextItem().setTitle('First name').setRequired(true);
  form.addTextItem().setTitle('Last name').setRequired(true);
  form.addTextItem().setTitle('Phone number').setRequired(true);
  form.addTextItem().setTitle('Email').setRequired(true);
  form.addTextItem().setTitle('State').setRequired(true);
  form.addTextItem().setTitle('ZIP code');

  // --- Qualifying ---
  form.addTextItem().setTitle('Your age');

  form.addCheckboxItem().setTitle('Who are you looking to protect? (check all that apply)')
    .setChoiceValues(['My spouse / partner', 'My children', 'Myself (final expense)', 'My parents', 'My business / key person']);

  form.addMultipleChoiceItem().setTitle('What type of coverage are you interested in?').setRequired(true)
    .setChoiceValues(['Final expense / burial', 'Term life', 'Whole life', 'Mortgage protection', 'IUL (cash-value)', 'Not sure — help me decide']);

  form.addMultipleChoiceItem().setTitle('About how much coverage are you thinking?')
    .setChoiceValues(['Under $25,000', '$25,000 - $50,000', '$50,000 - $100,000', '$100,000 - $250,000', '$250,000+', 'Not sure']);

  form.addMultipleChoiceItem().setTitle('Do you currently use tobacco or nicotine?')
    .setChoiceValues(['No', 'Yes']);

  form.addMultipleChoiceItem().setTitle('How would you rate your overall health?')
    .setChoiceValues(['Excellent', 'Good', 'Fair', 'Poor']);

  form.addMultipleChoiceItem().setTitle('Are you a veteran or military family member?')
    .setChoiceValues(['No', 'Yes - veteran', 'Yes - military spouse / family']);

  form.addMultipleChoiceItem().setTitle('When are you looking to get coverage?').setRequired(true)
    .setChoiceValues(['As soon as possible', 'Within 30 days', 'Just researching for now']);

  form.addMultipleChoiceItem().setTitle('Best time to reach you')
    .setChoiceValues(['Morning', 'Afternoon', 'Evening', 'Any time']);

  // --- Consent (required — this is your TCPA basis to call them) ---
  form.addCheckboxItem().setTitle('Consent to be contacted').setRequired(true)
    .setChoiceValues([
      'I agree to be contacted by AnkaLife and a licensed insurance agent by phone, text, and email ' +
      'about life insurance, including by autodialer or prerecorded/AI voice, even if my number is on a ' +
      'Do-Not-Call list. Consent is not a condition of purchase, and I can opt out anytime by replying STOP.'
    ]);

  // --- Send every response to a spreadsheet you own (your full-access view) ---
  const ss = SpreadsheetApp.create('AnkaLife - Lead Responses');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // 🔔 Set up the email notification: fire onFormSubmitNotify() on every submission.
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onFormSubmitNotify') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onFormSubmitNotify').forForm(form).onFormSubmit().create();

  Logger.log('===== COPY THESE =====');
  Logger.log('PUBLIC form link (put on flyers / QR / social):  ' + form.getPublishedUrl());
  Logger.log('EDIT the form (change questions/branding):       ' + form.getEditUrl());
  Logger.log('RESPONSES sheet (who filled it out):             ' + ss.getUrl());
  Logger.log('EMAIL NOTIFICATIONS will be sent to:             ' + NOTIFY_EMAIL);
}

/**
 * Runs automatically on every form submission and emails you the lead.
 * (Wired up by createSurveyForm — you don't run this one yourself.)
 */
function onFormSubmitNotify(e) {
  try {
    const items = e.response.getItemResponses();
    let lines = [], first = '', last = '', phone = '';
    items.forEach(function (it) {
      const q = it.getItem().getTitle();
      let a = it.getResponse();
      if (Array.isArray(a)) a = a.join(', ');
      lines.push('• ' + q + ': ' + a);
      if (/^first name$/i.test(q)) first = a;
      if (/^last name$/i.test(q)) last = a;
      if (/phone/i.test(q)) phone = a;
    });
    const who = (first + ' ' + last).trim();
    const subject = '🔔 New life insurance lead' + (who ? ' — ' + who : '') + (phone ? ' · ' + phone : '');
    const body =
      'You have a NEW survey lead — call them soon (speed-to-lead wins):\n\n' +
      lines.join('\n') +
      '\n\nSubmitted: ' + new Date() +
      '\n\n(Full list lives in your "AnkaLife - Lead Responses" sheet.)';
    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
  } catch (err) {
    // Never let a notification error block the lead from being saved.
    Logger.log('notify error: ' + err);
  }
}
