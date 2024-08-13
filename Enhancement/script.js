const areaData = { 
  香港: { 
    中西區: ["西環", "堅尼地城", "石塘咀", "西營盤", "上環", "中環", "金鐘", "西半山", "中半山", "半山", "山頂"], 
    灣仔: ["灣仔", "銅鑼灣", "跑馬地", "大坑", "掃桿埔", "渣甸山"], 
    東區: ["天后", "寶馬山", "北角", "鰂魚涌", "西灣河", "筲箕灣", "柴灣", "小西灣"], 
    南區: ["薄扶林", "香港仔", "鴨脷洲", "黃竹坑", "壽臣山", "淺水灣", "舂磡角", "赤柱", "大潭", "石澳", "田灣"]
  }, 
  九龍: { 
    油尖旺: ["尖沙咀", "油麻地", "西九龍", "京士柏", "旺角", "大角咀", "佐敦", "太子"], 
    深水埗: ["美孚", "荔枝角", "長沙灣", "深水埗", "石硤尾", "又一村", "大窩坪", "昂船洲"], 
    九龍城: ["紅磡", "土瓜灣", "馬頭角", "馬頭圍", "啟德", "九龍城", "何文田", "九龍塘", "筆架山"], 
    黃大仙: ["新蒲崗", "黃大仙", "東頭", "橫頭磡", "樂富", "鑽石山", "慈雲山", "牛池灣"], 
    觀塘: ["坪石", "九龍灣", "牛頭角", "佐敦谷", "觀塘", "秀茂坪", "藍田", "油塘", "鯉魚門"] 
  }, 
  新界: { 
    葵青: ["葵涌", "青衣", "葵芳"], 
    荃灣: ["荃灣", "梨木樹", "汀九", "深井", "青龍頭", "馬灣", "欣澳"], 
    屯門: ["大欖涌", "掃管笏", "屯門", "藍地"], 
    元朗: ["洪水橋", "廈村", "流浮山", "天水圍", "元朗", "新田", "落馬洲", "錦田", "石崗", "八鄉"], 
    北區: ["粉嶺", "聯和墟", "上水", "石湖墟", "沙頭角", "鹿頸", "烏蛟騰"], 
    大埔: ["大埔墟", "大埔", "大埔滘", "大尾篤", "船灣", "樟木頭", "企嶺下", "太和"], 
    沙田: ["大圍", "沙田", "火炭", "馬料水", "烏溪沙", "馬鞍山"], 
    西貢: ["清水灣", "西貢", "大網仔", "將軍澳", "坑口", "調景嶺", "馬游塘"], 
    離島: ["長洲", "坪洲", "大嶼山", "東涌", "南丫島"] 
  }
};


function identifyLocation(inputString) {
    let identifiedArea = null;
    let identifiedDistrict = null;
    let identifiedSubdistrict = null;
    let cleanedString = inputString; // Initialize cleanedString to be the same as inputString

    // Check for exact address matches first
    for (let area in areaData) {
        for (let district in areaData[area]) {
            for (let subdistrict of areaData[area][district]) {
                // Check if the entire subdistrict exists in the input
                if (inputString.includes(subdistrict)) {
                    identifiedArea = area;
                    identifiedDistrict = district;
                    identifiedSubdistrict = subdistrict;
                    
                    // Avoid removing parts of the address that might be important
                    if (inputString === subdistrict) {
                        return [identifiedArea, identifiedDistrict, identifiedSubdistrict, inputString];
                    }
                    
                    // Only remove the subdistrict if it's a part of a larger address
                    cleanedString = inputString.replace(subdistrict, '').trim();

                    // If the cleanedString is not empty or too short, keep it as is
                    if (cleanedString.length > 0 && cleanedString !== subdistrict) {
                        return [identifiedArea, identifiedDistrict, identifiedSubdistrict, cleanedString];
                    }
                    
                    // If cleanedString is empty or too similar to subdistrict, keep the original
                    return [identifiedArea, identifiedDistrict, identifiedSubdistrict, inputString];
                }
            }
        }
    }
    
    // If no area, district, or subdistrict found, return the cleaned input as is
    return [identifiedArea, identifiedDistrict, identifiedSubdistrict, inputString.trim()];
}


async function lookupAddress(query, language = 'zh-Hant', maxResults = 200) {
    const url = `https://www.als.gov.hk/lookup?q=${query}&n=${maxResults}`;
    const headers = {
        'Accept': 'application/json',
        'Accept-Language': language
    };

    try {
        const response = await fetch(url, { headers });
        if (response.ok) {
            return await response.json();
        } else {
            console.error('Error fetching data:', response.statusText);
            return {};
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return {};
    }
}

function createGeoAddressLink(geoAddress) {
    return geoAddress ? `https://www.map.gov.hk/gm/map/s/geoaddr/${encodeURIComponent(geoAddress)}` : '';
}

function createTableRow(result) {
    return `
        <tr>
            <td>${escapeHtml(result.Input)}</td>
            <td>${escapeHtml(result.Area)}</td>
            <td>${escapeHtml(result.District)}</td>
            <td>${escapeHtml(result.Subdistrict)}</td>
            <td>${escapeHtml(result.CleanedInput)}</td>
            <td>${escapeHtml(result.MatchedBuilding)}</td>
            <td><a href="${escapeHtml(result.GeoAddressLink)}" target="_blank">${escapeHtml(result.GeoAddress)}</a></td>
            <td>${escapeHtml(result.Latitude)}</td>
            <td>${escapeHtml(result.Longitude)}</td>
        </tr>
    `;
}

function escapeHtml(html) {
    const text = document.createTextNode(html);
    const div = document.createElement('div');
    div.appendChild(text);
    return div.innerHTML;
}

async function processAddresses() {
    const addresses = document.getElementById('addressInput').value.split('\n').map(addr => addr.trim()).filter(addr => addr.length > 0);
    const resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = ''; // Clear previous results
    document.getElementById('resultsTable').style.display = 'none'; // Hide the table initially
    document.getElementById('downloadButton').style.display = 'none'; // Hide download button initially

    createProgressBar(); // Call to create the progress bar

    // Initialize the map
    const map = L.map('map').setView([22.3964, 114.1095], 11);
    L.tileLayer(
      "https://landsd.azure-api.net/dev/osm/xyz/basemap/gs/WGS84/tile/{z}/{x}/{y}.png?key=f4d3e21d4fc14954a1d5930d4dde3809"
    ).addTo(map);

    L.tileLayer(
      "https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/en/wgs84/{z}/{x}/{y}.png",
      {
        attribution:
          '<a href="https://api.portal.hkmapservice.gov.hk/disclaimer" target="_blank" class="copyrightDiv">&copy;Map information from Lands Department </a><img src="https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg" height=20></img>',
        maxZoom: 18
      }
    ).addTo(map);

    const markers = L.markerClusterGroup();
    map.addLayer(markers);

    for (let inputString of addresses) {
        const [area, district, subdistrict, cleanedString] = identifyLocation(inputString);

        // Perform a lookup even if no area or district is identified
        const lookupQuery = cleanedString || inputString;
        const lookupResults = await lookupAddress(lookupQuery);

        let fullAddress = 'No matches found';
        let geoAddress = 'N/A';
        let latitude = 'N/A';
        let longitude = 'N/A';
        let matchedBuilding = 'No Building Name';

        if (lookupResults.SuggestedAddress && Array.isArray(lookupResults.SuggestedAddress)) {
            const firstMatch = lookupResults.SuggestedAddress.find(result => 
                !district || result.Address.PremisesAddress.ChiPremisesAddress.ChiDistrict.DcDistrict.includes(district)
            ) || lookupResults.SuggestedAddress[0]; // Use the first match if no district match

            if (firstMatch) {
                const rawAddress = firstMatch.Address.PremisesAddress.ChiPremisesAddress;
                matchedBuilding = rawAddress.BuildingName || 'No Building Name';
                fullAddress = `${matchedBuilding}`;
                geoAddress = firstMatch.Address.PremisesAddress.GeoAddress || 'N/A';
                latitude = firstMatch.Address.PremisesAddress.GeospatialInformation.Latitude || 'N/A';
                longitude = firstMatch.Address.PremisesAddress.GeospatialInformation.Longitude || 'N/A';

                if (latitude !== 'N/A' && longitude !== 'N/A') {
                    const latLng = [parseFloat(latitude), parseFloat(longitude)];
                    const marker = L.circleMarker(latLng, {
                        radius: 5,
                        fillColor: "#ff0000",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    }).bindPopup(`<b>${fullAddress}</b><br>${district || ''}, ${subdistrict || ''}`);
                    markers.addLayer(marker);
                }
            }
        }

        resultsBody.innerHTML += createTableRow({
            Input: inputString,
            Area: area || '',
            District: district || '',
            Subdistrict: subdistrict || '',
            CleanedInput: cleanedString,
            MatchedBuilding: matchedBuilding,
            GeoAddress: geoAddress,
            GeoAddressLink: createGeoAddressLink(geoAddress),
            Latitude: latitude,
            Longitude: longitude
        });

        // Update the progress bar
        const percentage = Math.round((resultsBody.children.length / addresses.length) * 100);
        updateProgressBar(percentage);
    }

    document.getElementById('resultsTable').style.display = 'table'; // Show the table
    document.getElementById('downloadButton').style.display = 'block'; // Show the download button

    const progressContainer = document.getElementById('progressContainer');
    if (progressContainer) {
        progressContainer.style.display = 'none'; // Hide the progress container
    }
}


function createProgressBar() {
    const progressContainer = document.createElement('div');
    progressContainer.id = 'progressContainer';

    const progressBar = document.createElement('div');
    progressBar.id = 'progressBar';

    const progressText = document.createElement('span');
    progressText.id = 'progressText';

    progressContainer.appendChild(progressBar);
    progressContainer.appendChild(progressText);
    document.body.appendChild(progressContainer);
}


function updateProgressBar(percentage) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressBar.style.width = percentage + '%';
    progressText.textContent = percentage + '% completed';
}

function downloadResults() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Input,Area,District,Subdistrict,Cleaned Input,Matched Building,GeoAddress,Latitude,Longitude\n";

    document.querySelectorAll('#resultsBody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = Array.from(cells).map(cell => cell.textContent).join(",");
        csvContent += rowData + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "address_results.csv");
    document.body.appendChild(link);
    link.click();
}