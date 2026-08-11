/* =========================
   MOBILE MENU
========================= */

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle.addEventListener("click", () => {
  mainNav.classList.toggle("active");
});


/* =========================
   MOBILE DROPDOWNS
========================= */

const dropdownButtons =
  document.querySelectorAll(".nav-dropdown > button");

dropdownButtons.forEach(button => {

  button.addEventListener("click", () => {

    const dropdown = button.parentElement;

    if (window.innerWidth <= 1050) {
      dropdown.classList.toggle("open");
    }

  });

});


/* =========================
   LOAN FORM
========================= */

const loanForm = document.getElementById("loanForm");
const formMessage = document.getElementById("formMessage");

loanForm.addEventListener("submit", (event) => {

  event.preventDefault();

  const amount =
    Number(document.getElementById("amount").value);

  const email =
    document.getElementById("email").value.trim();

  const emailConfirm =
    document.getElementById("emailConfirm").value.trim();

  if (amount < 5000) {

    formMessage.textContent =
      "The minimum loan amount is £5,000.";

    return;
  }

  if (email !== emailConfirm) {

    formMessage.textContent =
      "The email addresses do not match.";

    return;
  }

  /*
    This is only the front-end demonstration.

    Connect this form to your own backend/API here.
  */

  formMessage.textContent =
    "Thank you. Your enquiry has been received.";

  loanForm.reset();

});


/* =========================
   COOKIE BANNER
========================= */

const cookieBanner =
  document.getElementById("cookieBanner");

const allowCookies =
  document.getElementById("allowCookies");

const denyCookies =
  document.getElementById("denyCookies");


function closeCookieBanner() {
  cookieBanner.style.display = "none";
  localStorage.setItem("cookiesChoice", "saved");
}


if (localStorage.getItem("cookiesChoice")) {
  cookieBanner.style.display = "none";
}


allowCookies.addEventListener(
  "click",
  closeCookieBanner
);

denyCookies.addEventListener(
  "click",
  closeCookieBanner
);


/* =========================
   CLOSE MOBILE MENU
   AFTER CLICKING LINK
========================= */

document.querySelectorAll(".main-nav a").forEach(link => {

  link.addEventListener("click", () => {

    if (window.innerWidth <= 1050) {
      mainNav.classList.remove("active");
    }

  });

});