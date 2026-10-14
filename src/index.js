let citySelect = document.querySelector("#cities");
let currentDateElement = document.querySelector("#current-date");

function updateSelectedCityTime() {
  let selectedZone = citySelect.value;

  if (!selectedZone) {
    currentDateElement.textContent = "";
    return;
  }

 let cityName = citySelect.options[citySelect.selectedIndex].textContent.trim();
  let localTime = moment().tz(selectedZone).format("dddd, MMMM D, YYYY h:mm:ss A");
  let timezoneName = moment.tz(selectedZone).zoneAbbr();

  currentDateElement.innerHTML = `It is <strong>${localTime}</strong> in ${cityName} (${selectedZone})<br />Timezone: ${timezoneName}`;
}

citySelect.addEventListener("change", updateSelectedCityTime);
setInterval(updateSelectedCityTime, 1000);