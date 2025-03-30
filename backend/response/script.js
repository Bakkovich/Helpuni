document.addEventListener("DOMContentLoaded", function() {
    const preElement = document.getElementById('response');
    const ansiUp = new AnsiUp();
    preElement.innerHTML = ansiUp.ansi_to_html(preElement.textContent);
  });