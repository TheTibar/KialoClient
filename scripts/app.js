var water = 0;
var mymap; 
var circle; //utilisé lors de l'init
var circleGroup; //layer de circles
var new_marker; //utilisé lors de la création d'un nouveau point
var red_array = ["#C0392B", "#CD6155", "#D98880", "#E6B0AA", "#F2D7D5", "#F9EBEA"];
var blue_array = ["#2980B9", "#5499C7", "#7FB3D5", "#A9CCE3", "#D4E6F1", "#EAF2F8"];

var blueTap = L.icon({
    iconUrl: 'https://reivaxweb.me/KialoServeur/Img/R_bleu.png',
    iconSize:     [38, 38], // size of the icon
    iconAnchor:   [19, 19], // point of the icon which will correspond to marker's location
	popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var redTap = L.icon({
    iconUrl: 'https://reivaxweb.me/KialoServeur/Img/R_rouge.png',
    iconSize:     [38, 38], // size of the icon
    iconAnchor:   [19, 19], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});




//var host = "https://reivaxweb.me/KialoServeur/"; //à utiliser chez OVH
var host = "http://localhost/KialoServeur/"; //à utiliser pour une simulation dans le navigateur à la maison
//var host = "http://localhost/my-app/KialoServeur/"; //à utiliser pour une simulation dans le navigateur au travail
//var host = "http://192.168.43.88/KialoServeur/"; //à utiliser pour une simulation dans l'émulateur si 4g téléphone
//var host = "http://192.168.0.13/KialoServeur/"; //à utiliser pour une simulation dans l'émulateur si réseau local

/* PARTIE INTERFACE */

function indexPage()
{
	document.getElementById("header").innerHTML = 'Kialo'
	
	document.getElementById("footer").innerHTML = "Kialo";
	document.getElementById("mail_kialo").innerHTML = '<A HREF="mailto:kialo.gp@gmail.com">Envoyez nous un email</A>'
	var htmlRender = 
	'<div id="content">'
	+ '<img id="up_arrow" src="https://reivaxweb.me/KialoServeur/Img/up_arrow.png" onClick="hideSpan()">'
	+ '<p><span class="texte">Kialo a pour vocation de géolocaliser les coupures d’eau en Guadeloupe.'
	+ '<br>Plus nous aurons d&apos;informations plus nous pourrons nous organiser et anticiper les coupures avant de rentrer chez nous.'
    + '<br>Nous vous invitons à cliquer sur le <span style="color:#F00C0A";> robinet rouge</span> en cas de coupure et sur le <span style="color:#1697D3";>robinet bleu</span> en cas de retour de l’eau.'
    + '<br><br>La récolte de ces informations est anonyme.</span>'
	+ '</p>'
	+ '</div>'
	+ '<div id="no_content">'
	+ '<img id="down_arrow" src="https://reivaxweb.me/KialoServeur/Img/down_arrow.png" onClick="showSpan()">'
	+ '</div>'
	+ '<div id="mapid"></div>'
	+ '<div id="legend"></div>'
	+ '<div id="actions">'
	+ '<table border-style="INSET" width="90%" align="center">'
	+ '<tr>'
	+ '<td align="center" width="50%" onclick="setWater()" style="cursor:pointer">'
	+ '<img height="50" src="https://reivaxweb.me/KialoServeur/Img/R_bleu.png" alt="Eau">'
	+ '</td>'
	+ '<td align="center" width="50%" onclick="setNoWater()" style="cursor:pointer">'
	+ '<img height="50" src="https://reivaxweb.me/KialoServeur/Img/R_rouge.png" alt="Pas d&apos;eau">'
	+ '</td>'
    + '</tr>'
    + '<tr id="tr_valid">'
	+ '<td align="center" id="td_valid" colspan="2" bgcolor="#DCDCDC">Je valide ma position'
	+ '</td>'
	+ '</tr>'
	+ '</table>'
	+ '</div>';
	document.getElementById("app").innerHTML = htmlRender;
	
	if(localStorage.getItem("hideDisclaimer") !== null)
	{
		if(localStorage.getItem("hideDisclaimer") === "1")
		{
			hideSpan();
		}
		else
		{
			showSpan();
		}
	}
	else
	{
		showSpan();
	}
	
	initMap();
}

function hideSpan()
{
	document.getElementById("content").style.visibility="hidden";
	document.getElementById("content").style.height="0";
	document.getElementById("no_content").style.visibility="visible";
	document.getElementById("no_content").style.height="auto";
	localStorage.setItem("hideDisclaimer", 1);
}

function showSpan()
{
	document.getElementById("no_content").style.visibility="hidden";
	document.getElementById("no_content").style.height="0";
	document.getElementById("content").style.visibility="visible";
	document.getElementById("content").style.height="auto";
	localStorage.setItem("hideDisclaimer", 0);
}

/* PARTIE FONCTIONS TECHNIQUES */
function initMap()
{
	mymap = L.map('mapid').setView([16.2, -61.4], 9);
	//alert("Init map");
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidGliYXIiLCJhIjoiY2p2eW92Z25yMDN3MDQ4bnVqb3k2NGMwYSJ9.FYcRcKS_9sd14ISGwZtM0w', {
	    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	    maxZoom: 18,
	    id: 'mapbox.streets',
	    accessToken: 'your.mapbox.access.token'
	}).addTo(mymap);

	circleGroup = L.layerGroup();

	getLastPositions();
}

function getLastPositions()
{
	circleGroup.clearLayers();

    var url = host + "WebServices/WS_getLastPositions.php";
    var xhr = new XMLHttpRequest();
    xhr.timeout = 2000;
    xhr.onreadystatechange = function (e) {
        if (xhr.readyState === 4) {
			console.log(xhr.responseText);
			var Positions = JSON.parse(xhr.responseText);
			//console.log(Positions);
			switch(xhr.status) {
				case 200:
					var Positions_Data = Positions.data.last_position_array;
					//console.log(Positions_Data);
					//console.log(Positions_Data.length);
					for (var i = 0; i < Positions_Data.length; i++) {
						//Code pour ajouter les cercles sur la carte
						//alert(Positions_Data[i].water);
						if (Positions_Data[i].water === "1")
						{
							circle = L.circle([Positions_Data[i].latitude, Positions_Data[i].longitude], {
								color: 'blue',
								opacity: 0.5,
								weight: 1,
								fillColor: 'blue',
								fillOpacity: 0.5,
								radius: 500
							});//.addTo(mymap);

							circle.bindPopup(Positions_Data[i].created_on);
						}
						else
						{
							circle = L.circle([Positions_Data[i].latitude, Positions_Data[i].longitude], {
								color: 'red',
								opacity: 0.5,
								weight: 1,
								fillColor: 'red',
								fillOpacity: 0.5,
								radius: 500
							});//.addTo(mymap);

							circle.bindPopup(Positions_Data[i].created_on);
						}
						circleGroup.addLayer(circle);
					}

					mymap.addLayer(circleGroup);
					
					htmlRender = '<p><span class="red_dot"></span> : Un utilisateur a déclaré une coupure d&apos;eau dans les 12 dernières heures</p>'
						+ '<p><span class="blue_dot"></span> : Un utilisateur a déclaré avoir l&apos;eau dans les 12 dernières heures</p>';
					
					document.getElementById("legend").innerHTML=htmlRender;
					break;
				case 500:
					msg = Positions.status_message;
					alert(msg);
					break;
				case 403:
					msg = Positions.status_message;
					document.getElementById("legend").innerHTML='<p><span class="texte">Pas de donnée récente</span></p>';
					break;
			}
        }
    };

    xhr.ontimeout = function () {
		msg = "fatal_error_connect_database";
        router.navigate('#Error:' + T(msg));
    };
    xhr.open("GET", url, true);
    xhr.send();

}


function setWater() 
{
	//alert("Water");
	water = 1;
	getLocation();
}

function setNoWater() 
{
	//alert("No Water");
	water = 0;
	getLocation();
}


function getLocation() 
{
	//alert("getLocation");
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(showPosition, errorPosition);
	} else {
		document.getElementById('td_valid').bgColor = '#DCDCDC';
		alert("Appeler la fonction qui affiche la page d'erreurs");
	}
}

function errorPosition(positionerror)
{
	document.getElementById('td_valid').bgColor = '#DCDCDC';
	alert(positionerror.message);
	}

function showPosition(position) 
{
	//Permet de supprimer le marqueur si on change de position entre 2 clics sur un des robinets
	if (new_marker != undefined) {
		mymap.removeLayer(new_marker);
    };
	/*	*/
	if (water === 1) {
		new_marker = L.marker([position.coords.latitude, position.coords.longitude], {
			icon: blueTap
		}).addTo(mymap);
	};
	
	if (water === 0) {
	new_marker = L.marker([position.coords.latitude, position.coords.longitude], {
		icon: redTap
	}).addTo(mymap);
	};

	
	/*	
	new_marker = L.marker([position.coords.latitude, position.coords.longitude], {
	icon: blueTap,
	}).addTo(mymap);
	*/
	
	x = document.getElementById("tr_valid");
	x.innerHTML = '<td id="td_valid" align="center" bgcolor="#36A6A2" colspan="2" onclick="savePosition(' + position.coords.latitude + ', ' + position.coords.longitude + ')" style="cursor:pointer">Valider</td>';

}


function savePosition(lat, long)
{
	//alert("Sauvegarde");
	
	if (new_marker != undefined) {
        mymap.removeLayer(new_marker);
    };
	
	var htmlRender = '<td align="center" id="td_valid" colspan="2" bgcolor="#DCDCDC";>Je valide ma position</td>';
	document.getElementById("tr_valid").innerHTML = htmlRender;
	
	var lat_uri = encodeURIComponent(lat);
	var long_uri = encodeURIComponent(long);
	var water_uri = encodeURIComponent(water);
	
	
	//Appel asynchrone au ws de sauvegarde
    // On crée le point en bdd
    var url = host + "WebServices/WS_savePosition.php?latitude=" + lat_uri + "&longitude=" + long_uri + "&water=" + water_uri;
    //alert(url);
    var xhr = new XMLHttpRequest();
    xhr.timeout = 2000;
    xhr.onreadystatechange = function (e) {
        if (xhr.readyState === 4) {
			//console.log(xhr);
			var savePosition = JSON.parse(xhr.responseText);
			switch(xhr.status) {
				case 200:
					//alert("Donnée sauvegardée");
					//initMap();
					getLastPositions();
					break;
				case 400:
					//ne doit pas arriver (les données sont vérifiées avant d'appeler le service)
					alert("Données manquantes" + savePosition.msg);
					break;
				case 500:	
					alert("Erreur base de données");
					break;
			}
        }
    };
    xhr.ontimeout = function () {
		msg = "fatal_error_connect_database";
		alert(msg);
    };
    xhr.open("GET", url, true);
    xhr.send();
}


