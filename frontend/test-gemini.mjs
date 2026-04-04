import { GoogleGenerativeAI } from '@google/generative-ai';
async function run() {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyC63ZWp6BeqSPwX4NBpTJoC3pGJyUY1niQ");
    const json = await response.json();
    console.log("Models:", json.models.map(m => m.name).join("\n"));
  } catch (e) {
    console.error("ERROR!!", e.message);
  }
}
run();
