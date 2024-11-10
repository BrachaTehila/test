
const cityCache = new Map();

async function fetchCities() {
    try {
        const response = await fetch('https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba&q=&limit=32000');

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const cities = data.result.records;
        setElementsDropdown(cities);
    } catch (error) {
        errorDiv();
    }

    function setElementsDropdown(cities) {

        const dropdown = document.getElementById('cityDropdown');
        cities.forEach(city => {
            if (city.שם_ישוב !== "לא רשום ") {
                const option = document.createElement('option');
                option.value = city.שם_ישוב;
                option.text = city.שם_ישוב;
                dropdown.appendChild(option);
            }
        });
    }

    const dropdown = document.getElementById('cityDropdown');
    dropdown.addEventListener('change', handleCitySelection);

    function handleCitySelection(event) {
        const selectedCity = event.target.value;
        fetchData(selectedCity);
    }

    async function fetchData(selectedCity) {

        if (cityCache.has(selectedCity)) {

            parties = cityCache.get(selectedCity);
            const selectedCityArray = Object.values(parties);
            createGraph(selectedCityArray[0]);
        }
        else {
            try {
                const response = await fetch(`https://data.gov.il/api/3/action/datastore_search?resource_id=929b50c6-f455-4be2-b438-ec6af01421f2&q={"שם ישוב":"${selectedCity}"}&limit=32000`);

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                const parties = data.result.records[0];
                const topParties = getTopParties(parties);
                cityCache.set(selectedCity, { topParties });
                createGraph(topParties);

            } catch (error) {
                errorDiv();
            }
        }
    }

    function getTopParties(parties) {

        const partiesArray = Object.keys(parties).map(party => ({ partyName: party, votes: parseInt(parties[party]) }));
        const validPartiesArray = partiesArray.filter(party => !isNaN(party.votes) && party.partyName !== "_id" && party.partyName !== "סמל ישוב");
        validPartiesArray.sort((a, b) => b.votes - a.votes);
        return validPartiesArray.slice(0, 7);
    }

    let myChart;

    function createGraph(topParties) {

        const labels = topParties.map(party => party["partyName"]);
        const dataValues = topParties.map(party => party["votes"]);

        const ctx = document.getElementById('myChart').getContext('2d');

        const chartData = {
            labels: labels,
            datasets: [{
                label: 'Votes',
                data: dataValues,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        };

        const options = {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        };

        if (myChart) {
            myChart.destroy();
        }

        myChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: options
        });
    }

    function errorDiv() {

        const errorDiv = document.createElement("div");
        errorDiv.innerText = "ERROR";
        document.body.appendChild(errorDiv);
    }
}
