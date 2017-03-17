function xmlToString(xmlData) {
    var xmlString;
    //IE
    if (window.ActiveXObject){
        xmlString = xmlData.xml;
    }
    // code for Mozilla, Firefox, Opera, etc.
    else{
        xmlString = (new XMLSerializer()).serializeToString(xmlData);
    }
    return xmlString;
}

function obj2string(obj) {
	var str=""
	for(var i in obj){
		str+=obj[i]+",";
	}
	return str.substr(0,str.length-1);
}

function getOffsetPosition(element,side){ //Side peut valoir: Left ou Top
	var iVal=0;
	var iScroll=0;
	var oObj=element;
	var osObj=oObj;
		
	var sType = "offset"+side;
	var scrType = "scroll"+side;
	
	var c=0;
	while (c<30 && oObj && oObj.tagName != "HTML") {
		c++;
		if(oObj==osObj){
			var curTransform = new WebKitCSSMatrix(window.getComputedStyle(oObj).webkitTransform);
			iVal += oObj[sType];
			if(side=="Left")iVal += curTransform.m41;
			else if(side=="Top")iVal += curTransform.m42;
			osObj = osObj.offsetParent;
		}
			
		if(oObj!=element){
			iScroll += oObj[scrType];
		}
		oObj = oObj.parentNode;
	}
	
	return iVal-iScroll;
}

function br2nl(str) {
    return str.replace(/<br\s*\/?>/mg,"\n");
}

function nl2br(str) {
    return str.replace(/\n+/mg,"<br />");
}

//afficher_txt========================
function afficher_txt(txt){ /* htmlspecialchars+nl2br*/
	if(typeof(txt)=="undefined") return "";
  	if(typeof(txt)!="string")return txt;
  	txt=txt.replace(RegExp("(\&)","gi"),"&amp;");
  	txt=txt.replace(/\"/g,"&quot;")
  	txt=txt.replace(/\'/g,"&#039;")
  	txt=txt.replace(RegExp("(\<)","gi"),"&lt;");
	txt=txt.replace(RegExp("(\>)","gi"),"&gt;");
	//if(!nobr)txt=txt.replace(RegExp("\n","gi"),"<br/>");
	return txt;
}

function ftel_lisible(_tel, _ptel){
	if(!_tel) return "";
	var reg=new RegExp("[^+0-9]","g");
	var reg4=new RegExp("^[+]","g");

	_tel=_tel.replace(reg,"");
	if(!_tel)return _tel;
	if(_tel.match(reg4)) _tel=_tel.replace(reg4,"00");

	if(!_ptel) {
		if(typeof(clientsoc)!="undefined" && clientsoc && clientsoc.ptel) var _ptel=clientsoc.ptel
		else if(typeof(societe)!="undefined" && societe && societe.ptel) var _ptel=societe.ptel;
		else var _ptel="33";
	}
	if(_ptel == "0") _ptel="33";

	var reg1=new RegExp("^(00|[+])?"+_ptel,"g");
	var reg2=new RegExp("^[9][123][0-9]+","g");
	var reg5=new RegExp("^0","g");

	if(_tel.match(reg1))_tel=_tel.replace(reg1,"0",_tel);
	else if(_tel.match(reg2)) _tel=_tel;
	else if(!_tel.match(reg5)) _tel="00"+_tel;

	var _newv="";
	//liste des indicatifs des pays
		var ar_indicatif_pays = [93,27,355,213,49,376,244,1264,1268,599,966,54,374,297,247,61,43,994,1242,
  			973,880,1246,32,501,229,1441,975,375,95,591,387,267,55,673,359,226,257,855,237,1,238,1345,
  			236,56,86,357,57,269,243,242,682,850,82,506,225,385,53,45,246,253,1,1767,20,971,593,291,34,
  			372,1,251,298,679,358,33,241,220,995,233,350,30,1473,299,590,1671,502,224,240,245,592,594,
  			509,504,852,36,91,62,964,98,353,354,972,39,1876,81,962,7,254,996,686,965,856,266,371,961,231,
  			218,423,370,352,853,389,261,60,265,960,223,500,356,1670,212,692,596,230,222,262,52,691,373,
  			377,976,382,1664,258,264,674,977,505,227,234,683,47,687,64,968,256,998,92,680,970,507,675,595,
  			31,51,63,48,689,1,351,974,262,40,44,7,250,1869,290,1758,378,1721,590,508,1784,677,503,685,1684,
  			239,221,381,248,232,65,421,386,252,249,211,94,46,41,597,268,963,992,255,886,235,420,672,66,
  			670,228,690,676,1868,216,993,1649,90,688,380,598,678,379,39,58,1340,1284,84,681,967,260,263,881];

		var reg7=new RegExp("^00[1-9][0-9][0-9][0-9]","g");

	if(_tel.match(reg7)){		//test pour les appels internationaux
		var reg6=new RegExp("^00","g")
		_newv+="00";//limiter � 00 pour le moment
		_tel=_tel.replace(reg6,"",_tel);
		//indicatif � 4 chiffres
		if((_tel.substr(0,1)==1 && in_array(_tel.substr(0,4),ar_indicatif_pays)) && (_tel.length>=6)){
			_newv+=_tel.substr(0,4)+" ";
			var reg13=new RegExp("^[1-9][0-9][0-9][0-9]","g");
			_tel=_tel.replace(reg13,"",_tel);
		}
		//indicatif � 3 chiffres
		else if(in_array(_tel.substr(0,3), ar_indicatif_pays ) && (_tel.length>=5)){
			_newv+=_tel.substr(0,3)+" ";
			var reg8=new RegExp("^[1-9][0-9][0-9]","g");
			_tel=_tel.replace(reg8,"",_tel);
		}
		//indicatif � 2 chiffres
		else if(in_array( _tel.substr(0,2), ar_indicatif_pays )){
			_newv+=_tel.substr(0,2)+" ";
			var reg9=new RegExp("^[1-9][0-9]","g");
			_tel=_tel.replace(reg9,"",_tel);
		}
		//indicatif � 1 chiffre
		else if(in_array( _tel.substr(0,1), ar_indicatif_pays )){
			_newv+=_tel.substr(0,1)+" ";
			var reg10=new RegExp("^[1-9]","g");
			_tel=_tel.replace(reg10,"",_tel);
		}
	}

	else {// pas d'indicatif

		var reg11=new RegExp("^[0-9]","g");
		_newv+=_tel.substr(0,1);
		_tel=_tel.replace(reg11,"",_tel);

	}

	//var _a=_tel.split('');

	var _t=_tel.length+1;
	//Insertion des espaces

	// 2 types d��criture du num�ro de t�l�phone par exemple
  	// le pr�fixe de Bruxelles est le 02 xxx xx xx ou 3 chiffres 067 xx xx xx.

  	var reg12=new RegExp("^0032");//belge
  	var reg14=new RegExp("^0041");//suisse
	if((_ptel==32 && _newv.length==1) || _newv.match(reg12)){
		ar_mobile=[47,48,49];
		ar_agglo_belge=[2,3,4,9];
		if(in_array(_tel.substr(0,2),ar_mobile)){
			_newv+=_tel.charAt(0)+" ";
			for(var i=0;i<_t;i++){
				if(i==0)continue;
				_newv+=_tel.charAt(i);
				if(i%2==0 && _t-i>=2)_newv+=" ";
			}
		}
		else if(!in_array(_tel.charAt(0),ar_agglo_belge)){
			_newv+=_tel.charAt(0)+_tel.charAt(1)+" ";
			for(var i=0;i<_t;i++){
				if(i<2)continue;
				_newv+=_tel.charAt(i);
				if(i%2==1 && _t-i>=2)_newv+=" ";
			}
		}
		else {
			_newv+=_tel.charAt(0)+" "+_tel.substr(1,3)+" ";
			for(var i=0;i<_t;i++){
				if(i<4)continue;
				_newv+=_tel.charAt(i);
				if(i%2==1 && _t-i>=2)_newv+=" ";
			}
		}
	}
	else if((_ptel==41 && _newv.length==1)|| _newv.match(reg14)){
		_newv+=_tel.substr(0,2)+" "+_tel.substr(2,3)+" "+_tel.substr(5,2)+" "+_tel.substr(7);
	}
	else {
		if(_t%9==0){
			_newv+=_tel.charAt(0)+_tel.charAt(1)+" ";
			for(var i=0;i<_t;i++){
				if(i<2)continue;
				_newv+=_tel.charAt(i);
				if(i%3==1 && _t-i>=3)_newv+=" ";
			}
		}
		else if(_t%2==0){
			_newv+=_tel.charAt(0)+" ";
			for(var i=0;i<_t;i++){
				if(i==0)continue;
				_newv+=_tel.charAt(i);
				if(i%2==0 && _t-i>=2)_newv+=" ";
			}
		}
		else {
			_newv+=_tel.charAt(0)+" "+_tel.substr(1,3)+" ";
			for(var i=0;i<_t;i++){
				if(i<4)continue;
				_newv+=_tel.charAt(i);
				if(i%2==1 && _t-i>=2)_newv+=" ";
			}
		}
	}
	return(_newv);
}

function trim(myString){
return myString.replace(/^[\s\n]+/g,'').replace(/[\s\n]+$/g,'')
}

function in_array(needle,ar){
	for(var i in ar)if(needle==ar[i])return true;
	return false;
}

function array_merge(ar1,ar2){
	if(!ar1)ar1=new Array();
	for(var i in ar2)ar1[i]=ar2[i];
	return ar1;
}

//textes
var almois=new Array(31,28,31,30,31,30,31,31,30,31,30,31);
var amois=new Array("Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre");
var amoiscourts=new Array("Jan","Fév","Mars","Avr","Mai","Juin","Juil","Août","Sept","Oct","Nov","Déc");
var ajours=new Array("Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi");
var ajourscourts=new Array("Dim.","Lun.","Mar.","Mer.","Jeu.","Ven.","Sam.");

function mytodfr(v){//2010-09-08 09:00-> 08/09/2010 09:00
	if(!v)return "";
	var reg=new RegExp("[- :/]","g");
	a=v.split(reg);
	if(a.length==3) return a[2]+"/"+a[1]+"/"+a[0];
	if(a.length==5 ||a.length==6) return a[2]+"/"+a[1]+"/"+a[0]+" "+a[3]+":"+a[4];
}


function fr2jd(v){
  if(!v)return "";
  var reg=new RegExp("[- :/]","g");
  a=v.split(reg);
  return a[2]+"-"+a[1]+"-"+a[0];
}

function d2my(d){ //js date to mysql date
	if(!d)var d=new Date;
	if (!d.getMonth) return false;
	var mday=d.getDate();
	var m=d.getMonth()+1;
	var a=d.getFullYear();
	var day_id=a+'-';
	if(m<10)day_id+='0';
	day_id+=m+'-';
	if(mday<10)day_id+='0';
	day_id+=mday;
	return day_id;
}

function fr2jd(v){
  if(!v)return "";
  var reg=new RegExp("[- :/]","g");
  a=v.split(reg);
  return a[2]+"-"+a[1]+"-"+a[0];
}

function h2my(d){ //js date to HH:MM
	if(!d)var d=new Date;
	if (!d.getMonth) return false;
	var h=d.getHours();
	var i=d.getMinutes();

	if(h<10)r="0"+(h+":");
	else r=(h+":");

	if(i<10)r+="0"+i;
	else r+=i;

	return r;
}

function jd2my(d){ //js date to mysql datetime
	if(!d)var d=new Date;
	if (!d.getMonth) return false;
	var mday=d.getDate();
	var m=d.getMonth()+1;
	var a=d.getFullYear();
	var h=d.getHours();
	var i=d.getMinutes();
	var s=d.getSeconds();

	var r=a+'-';
	if(m<10)r+='0';
	r+=m+'-';
	if(mday<10)r+='0';
	r+=mday;
	r+=" ";
	if(h<10)r+="0"+(h+":");
	else r+=(h+":");

	if(i<10)r+="0"+(i+":");
	else r+=i+":";

	if(s<10)r+="0"+s;
	else r+=s;

	return r;
}




function jd2fr(d){ //js date to fr date
	if(!d)var d=new Date;
	if (!d.getMonth) return false;
	var mday=d.getDate();
	var m=d.getMonth()+1;
	var a=d.getFullYear();

	var day_id=mday+"/";
	if(mday<10)day_id='0'+day_id;
	if(m<10)day_id+='0';
	day_id+=m+'/';
	day_id+=a;

	return day_id;
}

function jd2fr2(d){ //js date to fr date + jsem
	if(!d)var d=new Date;
	if (!d.getMonth) return false;
	var mday=d.getDate();
	var m=d.getMonth()+1;
	var a=d.getFullYear();
  var day_id=ajourscourts[d.getDay()]+" ";

	if(mday<10) var day_id=ajourscourts[d.getDay()]+' 0'+mday+"/";
	else var day_id=ajourscourts[d.getDay()]+' '+mday+"/";

	if(m<10)day_id+='0';
	day_id+=m+'/';
	day_id+=a;

	return day_id;
}

function jh2fr(d){ //js date to hour
	if(!d)var d=new Date;
	if (!d.getMonth) return false;

	var h=d.getHours();
	var n=d.getMinutes();

	var day_id="";

	if(h<10)day_id+='0';
	day_id+=h+':';
	if(n<10)day_id+='0';
	day_id+=n;

	return day_id;
}


function dt2fr(d){ // YYYY-MM-DD hh:mm:ss vers DD/MM/YYYY hh:mm
  if(!d)return "";
  var reg=new RegExp("[ ]","g");
  var reg1=new RegExp("[-]","g");
  var reg2=new RegExp("[:]","g");
  var ad=d.split(reg);
  var i;
  var r="";
  for(i=0;i<ad.length;i++){
    var add=ad[i].split(reg1);
    if(add.length==3){
      r+=add[2]+"/"+add[1]+"/"+add[0];
      continue;
    }
    var add=ad[i].split(reg2);
    if(add.length==3){
      if(i==1)r+=" ";
      r+=add[0]+"h"+add[1];
      continue;
    }
  }
  return r;
}

function my2jd(d,l){
  if(!d)return "";
  var reg=new RegExp("[ :-]","g");
  var ad=d.split(reg);
  if(!l)l=ad.length;
  switch(l){
    case 3:
      var jd=new Date(ad[0],ad[1]-1,ad[2]);
    break;
    case 5:
      var jd=new Date(ad[0],ad[1]-1,ad[2],ad[3],ad[4]);
    break;
    case 6:
      var jd=new Date(ad[0],ad[1]-1,ad[2],ad[3],ad[4],ad[5]);
    break;
  }
  return jd;
}

function fget_week_days(y,m,d){
	var dt=new Date(+y,+m-1,+d);
	var day=dt.getDay();
	if(day==0)day=7;
	dt=new Date(dt.getTime()-(day-1)*24*60*60*1000);
	var aday=new Array();
					
	for(var i=0;i<7;i++){
			
		// On prend le lundi de la semaine d'après et on enlève un jour
		if (i == 6) {
			var date = new Date(dt.getTime()+((i+1)*24*60*60*1000));
			aday[i] = new Date(date.getTime() - 24*60*60*1000);
		} else {
			aday[i]=new Date(dt.getTime()+i*24*60*60*1000);
		}
		
	}
	return aday;
}

function fdownload_file(uri,filename){
	switch(device){
		case "Android":
			var fileTransfer = new FileTransfer();
			var uri = encodeURI(uri);
			var filePath="cdvfile://localhost/persistent/ubicentrex/"+filename;
			fileTransfer.download(
			    uri,
			    filePath,
			    function(entry) {
			        console.log("download complete: " + entry.fullPath);
			        ftoast("Le document est stocké dans "+entry.toURL(),7000);
			        window.plugins.fileOpener.open(entry.toURL())
			        //window.open(entry.toURL(), '_system');
			    },
			    function(error) {
			    	ftoast("Erreur de téléchargement, code: "+error.code,2000);
			    },
			    false
			);
		break;
		default:
			window.open(uri, '_system', 'EnableViewPortScale=yes');
		break;
	}
}

function droit(n){
	if(!user_droits)return false;
	return in_array(n,user_droits);
}

function sec2duration(v){ //Transforme une durée en seconde en heur:min:sec
	var h=Math.floor(v/3600);
	v-=h*3600;
	var m=Math.floor(v/60);
	v-=m*60;
	var s=Math.floor(v);

	var _t="";
	if(h>0){
		if(h>9)_t+=h+":";
		else _t+="0"+h+":";
	}
	if(m>9)_t+=m+":";
	else _t+="0"+m+":";
	if(s>9)_t+=s;
	else _t+="0"+s;
	return _t;
}

function dateDiff(date1, date2){
    var diff = {}                           // Initialisation du retour
    var tmp = date2 - date1;
                    
    tmp = Math.floor(tmp/1000);             // Nombre de secondes entre les 2 dates
    diff.sec = tmp % 60;                    // Extraction du nombre de secondes
                    
    tmp = Math.floor((tmp-diff.sec)/60);    // Nombre de minutes (partie entière)
    diff.min = tmp % 60;                    // Extraction du nombre de minutes
                    
    tmp = Math.floor((tmp-diff.min)/60);    // Nombre d'heures (entières)
    diff.hour = tmp % 24;                   // Extraction du nombre d'heures
                    
    tmp = Math.floor((tmp-diff.hour)/24);   // Nombre de jours restants
    diff.day = tmp;
                    
    return diff;
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(d) {
    return [ d.getFullYear(), ("0" + (d.getMonth()+1)).slice(-2), ("0" + d.getDate()).slice(-2)].join('-')+' '+ [("0" + d.getHours()).slice(-2), ("0" + d.getMinutes()).slice(-2), ("0" + d.getSeconds()).slice(-2)].join(':');
}

function getClassMessage(amsg) {
					
	var res = "";
					
	if (typeof (amsg.ldroitsut) != "undefined") var adroitus = amsg.ldroitsut.split(',');
	else adroitus = new Array();
					
	if (in_array(21, adroitus) && amsg.n_utilisateurs == amsg.n_crm_clients && amsg.n_utilisateurs != amsg.ndossier) { //msg interne centre d'appel
		res = "messageTeleconsToTelecons"; // jaune
	} else if (!in_array(4, adroitus) && in_array(26, adroitus) && amsg.n_crm_clients != amsg.ndossier && amsg.n_utilisateurs != amsg.ndossier) { //envoyé par une secretaire
		res = "messageFromSec"; // vert
	} else if (amsg.n_utilisateurs == amsg.n_crm_clients && amsg.n_utilisateurs == amsg.ndossier) { //du cli au centre d'appel (envoyé)
		res = "messageMe"; // Blanc
	} else if (amsg.n_utilisateurs == amsg.ndossier) { // du cli à un autre user (envoyé)
		res = "messageMe"; // Blanc
	} else {
		res = "messageFromClient"; // Bleu
	}
					
	return res;
}

function getHTMLFromMessage(amsg, tableHTML) {
	
    var reg = new RegExp("[: -]", "g");
    var reg1 = new RegExp("\n", "g");
    var reg2 = new RegExp("[|]", "g");
					
    var tableClassNames = "tableMessage ";
					
    var txt = tableHTML;
					
    if (typeof (amsg.ldroitsut) != "undefined") var adroitus = amsg.ldroitsut.split(',');
    else adroitus = new Array();
					
    var tdMessageObjetClassNames = getClassMessage(amsg);
					
    // changer les statuts: suprimé,lu et traité
    if (amsg.old * 1 == 1) tableClassNames += " messageOld";
    // else if (amsg.trait * 1 == 1 && in_array(21, user_droits)) txt +=
    // "color:#636363;";
    else if (amsg.lu * 1 == 1) tableClassNames += " messageRead";
    else tableClassNames += " messageDefault";
					
    txt += " class='"+tableClassNames+"'>";
					
    // objet==============
    txt += "<tr><td colspan='2' class='tdMessageObjet "+tdMessageObjetClassNames+"'>";
    if (+amsg.important == 1) txt += "<font style='color:red;'>!</font> ";
	txt += (amsg.msg_cat != "" ? "<b>" + amsg.msg_cat.toUpperCase() + "</b>&nbsp;" : "");
    txt += (amsg.objet != "" ? "<i>Objet : " + amsg.objet + "</i>" : "");
    txt += "</td></tr>";
					
    // info du contact====
    txt += "<tr><td class='tdMessageInfosContact'>";
                    
    if (amsg.lco) {
                    
        if (amsg.co_dte_naissance && amsg.co_dte_naissance!='') txt += "Né(e) le " + mytodfr(amsg.co_dte_naissance) + "<br>";
        if (amsg.co_mail1) txt += "Email : " + amsg.co_mail1 + "<br>";
        if (amsg.co_tel_mobile) txt += "Tél M. : " + ftel_lisible(amsg.co_tel_mobile) + "<br>";
        if (amsg.co_tel_pri) txt += "Tél Pri : " + ftel_lisible(amsg.co_tel_pri) + "<br>";
        if (amsg.co_tel_pro) txt += "Tél Prof : " + ftel_lisible(amsg.co_tel_pro) + "<br>";
        if (amsg.co_tel_adsl) txt += "Tél Adsl : " + ftel_lisible(amsg.co_tel_adsl) + "<br>";
        if (amsg.co_tel_autre){
            if(amsg.co_tel_autre_des) txt += amsg.co_tel_autre_des+" : ";
            txt += ftel_lisible(amsg.co_tel_autre) + "<br>";
        }
                    
        if (amsg.emplacement) txt += "No. d'appelant : " + ftel_lisible(amsg.emplacement) + "<br>";
					
    }
	
    txt += "</td>";
					
    // Emetteur/Récepteur messages clients
    var emetteur = "";
    var recepteur = "";
                    
    if (this.msg_gen != 1) {
                    
        emetteur += afficher_txt(amsg.ut_nom_usuel);
        
        if(amsg.sous_tp<0 && amsg.lco){
            recepteur += afficher_txt(amsg.co_nom_usuel);
        }else if(amsg.n_crm_clients == amsg.n_utilisateurs) {
            recepteur = "La permanence téléphonique";
        } else {
            recepteur += afficher_txt(amsg.cli_nom_usuel);
        }
    }
                    
    txt += "<td class='tdMessageEmetteurRecepteur'>";
    var ardc = amsg.date_creation.split(reg);
    txt += "Le " + ardc[2] + "/" + ardc[1] + "/" + ardc[0] + " à " + ardc[3] + "H" + ardc[4]+"<br />";
    if(amsg.n_utilisateurs==this.ncli)txt += "À " + "<b>" + recepteur + "</b>";
    else txt += "De " + "<b>" + emetteur+ "</b>";
    txt += "</td>";
    txt + "</tr>";
                
    //contenue message===============
    var ar_ctn = amsg.txt.split(reg2);
                    
    if (ar_ctn[0].length > 100) {
        txt += "<tr><td colspan='2' class='tdMessageContent'>"+br2nl(ar_ctn[0]).substr(0,100)+"...</td></tr>";
    } else {
        txt += "<tr><td colspan='2' class='tdMessageContent'>"+br2nl(ar_ctn[0])+"</td></tr>";
    }
					
    txt += "</table>";
					
    return txt;
					
}