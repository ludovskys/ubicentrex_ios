/**csv_channel==============================================================================================================================*/
function csv_channel(ref,parent,nsoc){
	if(!ref || !parent) return;
	this.nsoc=nsoc;
	this.ref=ref;
	this.parent=parent;
	this.duree=0;

	//Conteneur
	this.htable=null;
	this.hrow=null;
	this.htelecons=null;
	this.hclient=null;
	this.hddeb=null;
	this.happelant=null;
	this.hduree=null;
	this.hpicto=null;

	//duree de l'appel
	this.dbeg=0;
	this.dureinit=0;
	this.passe=false; //passe=true : stop le chrono
	this.pref=null;
	this.timercall=null; //duree de l'enregistrement de l'appel
	//this.timer=null; //duree de l'appel
}

//fdisplay==========================================
csv_channel.prototype.fdisplay=function(htable,ar,passe,agent){
    if(!ar) ar=this.ar;
    else this.ar=ar;
	if(passe) this.passe=passe; //passe=true : stop le chrono ; copie : true si la ligne est copié et n'est pas juste déplacé
	this.pref=this.ar.npbx+"|"+this.ar.channel;

	if(!this.hrow || !htable || this.htable!=htable){ //update
		if(htable)this.htable=htable;
		this.agent=agent;
		if(this.passe) {}//this.hrow=this.htable.insertRow(1); //si historique, affichage de la nouvelle ligne au début
		else this.hrow=this.htable.insertRow(-1); //sinon affichage à la fin
		this.hrow.id="ch"+this.ar.npbx+"|"+this.ar.channel;

		var h=0;
		this.hpicto=this.hrow.insertCell(h);h++;
		/*if(this.passe){
			this.htelecons=this.hrow.insertCell(h);h++;
			this.hddeb=this.hrow.insertCell(h);h++;
		}*/
		this.hclient=this.hrow.insertCell(h);h++;
		this.happelant=this.hrow.insertCell(h);h++
		this.hduree=this.hrow.insertCell(h);

		this.hrow.style.borderTop="1px solid black";
		this.hrow.style.borderBottom="1px solid black";
	}


  //Appel sortant - entrant
  if(this.ar.tp==1){
    this.hpicto.innerHTML="E.";
  }else if(this.ar.tp==2){
    this.hpicto.innerHTML="S.";
  }
  else if(this.ar.tp==3){
    if(this.ar.statuscall==41)  this.hpicto.innerHTML="E.";
    else this.hpicto.innerHTML="S.";
    this.ar.nom_queue="In.";
  }

  //Savoir si l'appel est en cours ou pas
  var encours=0;
  if(this.ar.bridgepeer && (!this.agent || (this.agent && (this.ar.bridgepeer.substring(0,this.agent.ar.peer.length+5)=="SIP/"+this.agent.ar.peer+"-" || this.ar.bridgepeer.substring(0,11)=="SIP/10.0.0."))))encours=1;

	//Appelant
  var comp="";
  if(this.ar.vip==1)comp+="<span style='color:red;font-weight:bold;'>VIP </span>";//VIP
  if(+this.ar.appel_client==1) comp+="<span style='color:red;font-weight:bold;'>C </span> ";//Appel client
  if(this.ar.caller_name==this.ar.caller_num || !this.ar.caller_name) var appelant=ftel_lisible(this.ar.caller_num);
  else var appelant=this.ar.caller_name;
  appelant=comp+appelant;

  //Données
  if(this.htelecons) this.htelecons.innerHTML="<div style='height:18px;overflow:hidden;'>"+afficher_txt(this.ar.answer_name)+"</div>";
  this.hclient.innerHTML="<div style='height:18px;overflow:hidden;'>"+this.ar.called_name+"</div>";
  this.happelant.innerHTML="<div style='height:18px;overflow:hidden;'>"+appelant+"</div>";
  this.hduree.style.textAlign="right";

  this.hrow.style.margin="";
  this.hrow.style.cursor='';

  //Couleur de fond
  if(encours==1 && this.ar.hangup=='') this.hrow.style.backgroundColor="#eee"; //appel en cours
  else{
	if(this.ar.bridged==1 && this.ar.hangup=='')this.hrow.style.backgroundColor="#3399FF"; //appel s�lectionner
	else this.hrow.style.backgroundColor="#DFDFF2"; //autres
  }

  this.fsetduration();
}

//fsetduration========================================
csv_channel.prototype.fsetduration=function(){
	if(!this.passe) this.timer = setTimeout(this.ref+'.fsetduration()',5000);
	//duree de l'appel
	if(!this.ar) return;
	if(this.passe && this.ar.duration) this.duree=this.ar.duration;
	else{
		if(this.ar.duree*1!=this.dureinit || !this.dbeg){
	  		this.dureinit=this.ar.duree*1;
	  		this.dbeg=new Date();
	  	}
		var dnow=new Date();
		this.duree=this.dureinit+Math.round((dnow.getTime()-this.dbeg.getTime())/1000);
	}
	this.hduree.innerHTML=sec2duration(this.duree);
	//couleur en fonction de la duree
	if(this.duree>180){
		this.hduree.style.backgroundColor="red";
	}else if(this.duree>120){
		this.hduree.style.backgroundColor="orange";
	}else if(this.duree>60){
		this.hduree.style.backgroundColor="yellow";
	}else{
		this.hduree.style.backgroundColor="white";
	}
}

//fdelete========================================
csv_channel.prototype.fdelete=function(){
	if(this.hrow && this.hrow.rowIndex<2)return;
	if(this.timer) clearTimeout(this.timer);
	this.dureinit=0;
	this.dbeg=new Date();
	if(this.hrow)this.htable.deleteRow(this.hrow.rowIndex);
}

/**csv_agent==============================================================================================================================*/
function csv_agent(ref,parent,htarget,ar){
	if(!ref) return;
	if(!parent) return;
	this.parent=parent;
	this.ref=ref;

	this.stattitre=null;
	//Statistiques d'appels
	this.nbap30min=0;
	this.durstat="30";
	this.durapp30min=0;
	this.nbtotapp=0;
	this.stattitre=null; //Stat de l'agent
	this.titre=null; //Titre avec le nom de l'agent etc
	this.htable=null; //tableau contenant les lignes affect�s de l'agent;
	this.astatcall=new Array(); //Array contenant les 30 derniers appels
	this.msgpp=null; //popup de groupe d'appel
	this.timercall=null;
	if(ar && htarget) this.fdisplay(htarget,ar); //affichage de la case
}

//fdiplay==============================
csv_agent.prototype.fdisplay=function(htarget,ar){
	if(!ar || !htarget) return;
	this.ar=ar;
	this.htarget=htarget;
	if(!this.ar['n'])return;

	var a =new Array();
	for(var i=0;i<10;i++)a[i]=i;
	var txt="<table id='"+this.ar['n']+"tabagent' style='border-bottom:5px solid #eee;background:#ccc;width:100%;'>";
	txt+="<tr><td colspan=5 style='text-align:center;' id='"+this.ar['n']+"titre'>"
	txt+="<table style='width:100%'><tr><td>";

	txt+=this.ar["nom_usuel"]+" ("+this.ar["raison_sociale"]+")";
	if(this.ar['drdebordement']==1 || this.ar['drformation']==1){
      txt+=" - <span style='color:white;font-weight:bold;'>";
      if(this.ar['drdebordement']==1)txt+="D";
      if(this.ar['drformation']==1)txt+="F";
      txt+="</span>";
    }
	txt+= " - "+this.ar["peer"]+"</td>";
    //if(+this.ar["acd"]==1 && in_array(45,user_droits)) txt+="<td style='width:10px'>"+select(this.ar['n']+"acd_maxcalls",a,this.ar['acd_maxcalls'])+"</td>";
    txt+="<tr><td id='"+this.ar['n']+"stattitre'>-</td></table>";
	txt+="</td></tr>";

	txt+="<tr><th></th><th style='width:130px;'>Client</th><th style='width:130px;'>Appel du/de</th><th style='width:50px;'>Durée</th></tr>\n";
	txt+="</table>";

	this.h=document.createElement("div");
	this.h.setAttribute("cible",this.ar['n']);
	this.h.innerHTML=txt;
	this.htarget.appendChild(this.h);
    this.stattitre=document.getElementById(this.ar['n']+"stattitre");
	this.titre=document.getElementById(this.ar['n']+"titre");
    this.htable=document.getElementById(this.ar['n']+"tabagent");

	//initialiser les stats
	if(+this.ar['nb_call']>0){
		var ndte=my2jd(this.ar['dte_debut']);
		var dtem30min=new Date();
		dtem30min.setMinutes(dtem30min.getMinutes()-this.durstat);
		if(!ndte)  var ndte=new Date;
	    var dd=ndte.getTime()-dtem30min.getTime();
	    for(var i=0;i<this.ar['nb_call'];i++){
	    	var ar=new Array();
	  		ar['nbap30min']=1;
	  		ar['durapp30min']=Math.round(this.ar['d_call']*1);
	  		ar['dte']=ndte;
	  		this.astatcall.unshift(ar);
	  		var ndte=new Date(ndte.getTime()-(dd/this.ar['nb_call']));
	    }
		this.ar['nb_call']=0;
	}
	if(this.ar['nb_call_tot']) this.nbtotapp=this.ar['nb_call_tot'];
	this.faddnbapp();
}

//fupdate==============================
csv_agent.prototype.fupdate=function(ar){
  if(this.ar["acd"]==1 && ar.acd_maxcalls!=this.ar['acd_maxcalls'] && document.getElementById(this.ar['n']+"acd_maxcalls")){
		document.getElementById(this.ar['n']+"acd_maxcalls").value=ar.acd_maxcalls;
		this.ar['acd_maxcalls']=ar.acd_maxcalls;
	}
	this.faddnbapp();
}

//faddnbapp============================
csv_agent.prototype.faddnbapp=function(nb,dte_debut,dte_fin){
	if(nb==1){
		if(!dte_debut || !dte_fin) return;
		this.nbtotapp=this.nbtotapp*1+nb*1;

		var ar=new Array();
		ar['nbap30min']=nb*1;
		ar['durapp30min']=Math.round((my2jd(dte_fin)-my2jd(dte_debut))/1000);
		ar['dte']=my2jd(dte_debut);
		this.astatcall.unshift(ar);
	}
	//mettre � jour les stats
	var dtem30min=new Date();
	dtem30min.setMinutes(dtem30min.getMinutes()-this.durstat);
	this.nbap30min=0;
	var duretot=0;
	var j=0;
	for(var i in this.astatcall){
		//alert(this.astatcall[i].dte.getTime()+" "+dtem30min.getTime());
		if(this.astatcall[i] && this.astatcall[i].dte && this.astatcall[i].dte.getTime()<dtem30min.getTime()) delete this.astatcall[i];
		else{
			duretot=duretot+this.astatcall[i].durapp30min;
			this.nbap30min=this.nbap30min+this.astatcall[i].nbap30min;
			j++;
		}
	}

	if(j>0) this.durapp30min=Math.round(duretot/j);
	else this.durapp30min=0;

	this.fsetstat();
}


//fsetstat============================
csv_agent.prototype.fsetstat=function(nbap30min,nbtotapp,durapp30min,durstat){
	if(durapp30min && durapp30min!="") this.durapp30min=durapp30min;
	if(nbap30min && nbap30min!="") this.nbap30min=nbap30min;
	if(nbtotapp && nbtotapp!="")this.nbtotapp=nbtotapp;
	if(durstat) this.durstat=durstat;

	var txt="";
	if(this.nbap30min) txt+=this.nbap30min+" appels (sur "+this.durstat+" min) de "+Math.round(this.durapp30min)+" sec.";
	if(this.nbap30min && this.nbtotapp) txt+=" - ";
	if(this.nbtotapp)txt+=this.nbtotapp+" appels aujourd'hui";
	if(txt) this.stattitre.innerHTML=txt;
	//couleur
	if(this.nbap30min<=30*this.durstat/60){
		this.titre.className='supervisionTdGreen';
		this.titre.style.color='white';
		this.stattitre.style.color='white';
	}
	else if(this.nbap30min<=60*this.durstat/60){
		this.titre.className='supervisionTdYellow';
		this.titre.style.color='black';
		this.stattitre.style.color='black';
	}
	else if(this.nbap30min<=70*this.durstat/60){
		this.titre.className='supervisionTdRed';
		this.titre.style.color='black';
		this.stattitre.style.color='black';
	}
	else {
		this.titre.className='supervisionTdBlack';
		this.titre.style.color='white';
		this.stattitre.style.color='white';
	}
}

//fsetchannel==========================associe le channel �
csv_agent.prototype.fsetchannel=function(ochannel,achannel){
	if(!ochannel || !achannel) return;
	ochannel.fdisplay(this.htable,achannel,0,this);
}

//fdelete=============================
csv_agent.prototype.fdelete=function(){
  if (this.msgpp){
    this.msgpp.fdelete();
    this.msgpp=null;
  }
  if(this.h)this.h.parentNode.removeChild(this.h);
  if(this.timercall){
    clearTimeout(this.timercall);
    this.timercall=null;
  }
}

/**csv_calls==============================================================================================================================*/
function csv_calls(_ref,_pref,_oparent){
	this.ref=_ref;
	this.pref=_pref;
	this.oparent=_oparent;
}

csv_calls.prototype.finitial=function(){
	this.initial=1;

	this.toperiod=5000;
	this.atagent=new Array();
	this.lagent="";//liste des agents
	this.acontact=new Array();
	this.aqueue=new Array(); //tableau des groupes d'appel sur lesquels on est connecte
	this.nbrequest=0;
	this.nbagent=0;

	//Stat general
	this.nbdays=0;//nb d'appel total sur la journ�e
	this.nblost=0;//nb d'appel perdu
	this.nbdissuade=0;//nb d'appel dissuade
	this.nbcours=0; //nb d'appel en cours
	this.nbnonaffecte=0; //nb d'appel en hnbnonaffecte

	//les timers
	this.timer=null;

	//channels
	this.lastcheckid="";
	this.lastcheckidagent="";
	this.achannel=new Array();
	this.achannelarrive=new Array();
	this.achannelperdu=new Array();
	this.achanneldissuade=new Array();
	this.achannelaffecte=new Array();
	this.achannelhistorique=new Array();
	this.achannelsoustrait=new Array();
	var req={
		soapmethod:'sv_calls',
		act:'cadre_mobile',
		nsoc:user.nsoc
	};
	soap.call(req,this.finitial_clb,this);
}

csv_calls.prototype.finitial_clb=function(r,rt,myobj){
	if(!r)return;
	myobj.xmlqueue=r.selectNodes("queue/*");
	myobj.fremplir();
}

csv_calls.prototype.fremplir=function(){
	var a=new Array();
	a["header"]="<a onClick=\"fback_history();\" class='menu_left menu_left_back'> </a>";
	var ar=new Array();
	ar["0"]="Tous";
	for(var i=0;i<this.xmlqueue.length;i++){
		var opt=xmltag2array(this.xmlqueue[i]);
		if(opt["nqueue"])ar[opt["nsoc"]+'_'+opt["nqueue"]]=opt["group"];
		else ar[opt["nsoc"]+""]=opt["group"];
	}
	this.ogrp_select=new cselect(this.ref+".ogrp_select",this.pref+"grp_select",ar,"0",this.ref+".fonchage_grp");
	
	a["header"]+="<div class='divSv' style='width:"+(wwin-43)+"px;'>"+this.ogrp_select.fcreate("style='border:0;text-align:left;'")+"</div>";
	
	a["content"]="<p class='pWarning'><b>Attention, la supervision se met à jour toutes les 60 secondes</b></p>";

	a["content"]+="<table id='nb_appel' class='tableNbAppel'>";
	a["content"]+="<tr><td>Appels traités aujourd'hui :</td><td style='text-align:right;' id='"+this.pref+"sv_titleleft'></td></tr>";
	a["content"]+="<tr><td>Appels perdus :</td><td style='text-align:right;' id='"+this.pref+"sv_titleperdu'></td></tr>"
	a["content"]+="<tr><td>Appels dissuadés :</td><td style='text-align:right;' id='"+this.pref+"sv_titledissuade'></td></tr>"
	a["content"]+="<tr><td>Appels à l'arrivée :</td><td style='text-align:right;' id='"+this.pref+"sv_titlenonaffecte'></td></tr>";
	a["content"]+="<tr><td>Appels en cours :</td><td style='text-align:right;' id='"+this.pref+"sv_titleencours'></td></tr>";
	a["content"]+="</table>"
	a["content"]+="<div id='"+this.pref+"hagent' class='divAgent'></div>";

	fnew_page(a,"right");

	this.hnbday=document.getElementById(this.pref+"sv_titleleft");
	this.hnblost=document.getElementById(this.pref+"sv_titleperdu");
	this.hnbdissuade=document.getElementById(this.pref+"sv_titledissuade");
	this.hnbcours=document.getElementById(this.pref+"sv_titleencours");
	this.hnbnonaffecte=document.getElementById(this.pref+"sv_titlenonaffecte");
	this.hagent=document.getElementById(this.pref+"hagent");

	this.fsurv();
}
csv_calls.prototype.fonchage_grp=function(){
	this.fdelete();
	this.fsurv();
}
csv_calls.prototype.fsurv=function(){
	var qv=this.ogrp_select.v;
	if(qv==0)qv="-1";
	var nq=qv.split('_');
	this.nsoc=nq[0];
	if(nq.length==1)this.nqueue=-1;
	else this.nqueue=nq[1];
	req={
		soapmethod:'sv_calls',
		act:'survcsv',
		nsoc:this.nsoc,
		nqueue:this.nqueue,
		initial:this.initial,
		lastcheckid:this.lastcheckid,
		lastcheckidagent:this.lastcheckidagent,
		lagent:this.lagent
	}
	soap.call(req, this.fsurv_clb, this, function(){console.log("Erreur connexion")});
	this.timer = setTimeout(this.ref+".fsurv()", this.toperiod);
}

csv_calls.prototype.fsurv_clb=function(r,rt,myobj){
	//alert(xmlToString(r));
	if(!r)return;
	myobj.fsetstat(r);
	myobj.fsetagent(r);
	myobj.fsetchannel(r);

	myobj.initial=0;
	myobj.nbrequest=0;
}

//setstat==============================================================================
csv_calls.prototype.fsetstat=function(r){
	if(!r) return;
	var xnbdays=r.selectSingleNode("./nbday/nbday/text()");
	if(xnbdays)this.faddnbtraite(xnbdays.nodeValue);
	var xnblost=r.selectSingleNode("./nblost/nblost/text()");
	if(xnblost) this.faddnbperdu(xnblost.nodeValue);
	var xnbdissuade=r.selectSingleNode("./nbdissuade/nbdissuade/text()");
	if(xnbdissuade) this.faddnbdissuade(xnbdissuade.nodeValue);
	this.aqueue=new Array();
	var xlqueue=r.selectSingleNode("./lqueue/lqueue/text()");
	if(xlqueue) this.aqueue=xlqueue.nodeValue.split(',');
	if(this.nqueue>0)this.aqueue.push(this.nqueue);
}

//setagent==============================================================================
csv_calls.prototype.fsetagent=function(r){
	if(!r) return;
	//récupére les infos
	var nid=r.selectSingleNode("./agents/@check");
	if(nid) this.lastcheckidagent=nid.nodeValue;
	else return;
    var aagent = r.selectNodes("./agents/agent");
	this.acontact=new Array(); //liste des agents présents

	//Créer les agents
	for(var i=0;i<aagent.length;i++){
	    var arag=xmltag2array(aagent[i]); //m en tableau des données
	    var deco=0;
	    if(this.nqueue>0){
	      var aqueue=arag['queues'].split(";");
	      if(!in_array(this.nqueue,aqueue)) deco=1;
	    }

	    if(arag.peer=="" || +arag.connecte==0 ||deco==1){ //déconnecter
	    	if(this.atagent[arag['n']]){
	    		this.atagent[arag['n']].fdelete();
	    		delete this.atagent[arag['n']];
	    	}
	    }else if(!this.atagent[arag['n']]) {
	    	this.atagent[arag['n']]=new csv_agent(this.ref+".atagent["+arag['n']+"]",this,this.hagent,arag); //creation des agents
	    }else{
	    	this.atagent[arag['n']].fupdate(arag); //màj des agents
	    }
	}

	//conna�tre la liste des agents
	  this.lagent="";
	  var k=0;
	  for(var i in this.atagent){
	    if(isNaN(i)) continue;
	    this.acontact[i]=i; //liste des num d'agent
	    if(this.lagent)this.lagent+=",";
	    this.lagent+=i;
	    k++;
	  }

}

//setchannel==============================================================================
csv_calls.prototype.fsetchannel=function(r){
	if(!r) return;
	var nid=r.selectSingleNode("./agents/@check");
	if(!nid) return;
	this.lastcheckid=nid.nodeValue;

	var cchan=r.selectNodes("./channels/channel");
	for(var k=0;k<cchan.length;k++){
	    var achan = xmltag2array(cchan[k]);
	    //alert(achan.npbx+"|"+achan.channel)
	    if(typeof(this.achannel[achan.npbx+"|"+achan.channel])=="undefined"){ //Cr�ation
	    	this.achannel[achan.npbx+"|"+achan.channel]=new csv_channel(this.ref+".achannel['"+achan.npbx+"|"+achan.channel+"']",this,this.nsoc);
	    }

	    if(achan.statuscall!=60 && achan.statuscall!=61 && achan.n_contact==0 && achan.hangup==""){
			this.fsetchannelarrive(achan); //Appels � l'arriv�s  (nco=0)
		}else if(achan.n_contact!=-1 && achan.statuscall!=60 && achan.statuscall!=61 && achan.hangup=="" && ((achan.n_contact>0 && in_array(achan.n_contact,this.acontact)) || (achan.caller_n>0 && in_array(achan.caller_n,this.acontact)))){
			this.fsetchannelaffecte(achan);  //Appels affect� dt appels interne (nco!=0 et hangup==null)
		}else if(achan.n_contact!=-1 && achan.tp==1 && (achan.statuscall==37 || achan.statuscall==38) && this.initial==0){
			this.fsetchanneldissuade(achan);  //Appels dissuades d�j� comptabilis� lors de l'initialisation
		}else if(achan.n_contact!=-1 && achan.statuscall!=60 && achan.statuscall!=61 && achan.n_contact>0 && achan.hangup=="" && !in_array(achan.n_contact,this.acontact) && achan.statuscall!=33 && achan.statuscall!=39 && achan.statuscall!=34 && achan.statuscall!=35){
			this.fsetchannelsoustrait(achan);	 //Appels sous-traites (l'op�ratrice qui d�croche n'est pas dans le groupe d'appel des op�ratrices)
		}else{
		    if(achan.n_contact!=-1 && achan.statuscall!=60 && achan.statuscall!=61 && achan.hangup!=""&&((this.nqueue<=0 &&(in_array(achan.n_contact,this.acontact)||achan.nsoc0==this.nsoc||(this.nsoc==-1 && achan.nsoc0==user.nsoc && !droit(6))))|| in_array(achan.sda_queue,this.aqueue))){
		    	this.fsetchannelhistorique(achan);//Historique des appels (hangup!=null)
			}else{
		        this.fdeletechannel(achan);
		    }
		}
	    //Appels perdus
	    if(achan.n_contact!=-1 && achan.statuscall!=60 && achan.statuscall!=61 && achan.hangup!="" && achan.tp==1 && (achan.statuscall==30 || achan.statuscall==34 || achan.statuscall==35) && ((my2jd(achan.dte_modif)-my2jd(achan.dte_start))/1000)>15 && achan.bridged==0){
	       this.fsetchannelperdu(achan);
	    }
	}
}

//fsetchannelarrive=================================================================
csv_calls.prototype.fsetchannelarrive=function(achan){
	if(typeof(this.achannelarrive[achan.npbx+"|"+achan.channel])=="undefined"){
		this.achannelarrive[achan.npbx+"|"+achan.channel]=1;
		this.faddnbnonaffecte(1);
		if(achan.tp==1) this.faddnbencours(1);
	}
}

//fsetchannelaffecte==================================================================
csv_calls.prototype.fsetchannelaffecte=function(achan){
	if(this.atagent[achan.n_contact]) {
		this.atagent[achan.n_contact].fsetchannel(this.achannel[achan.npbx+"|"+achan.channel],achan);
	}else if(this.atagent[achan.caller_n]) {
		this.atagent[achan.caller_n].fsetchannel(this.achannel[achan.npbx+"|"+achan.channel],achan);
	}else {
	  this.achannel[achan.npbx+"|"+achan.channel].fdelete();
	  delete this.achannel[achan.npbx+"|"+achan.channel];
	}


	if(typeof(this.achannelaffecte[achan.npbx+"|"+achan.channel])=="undefined"){
		this.achannelaffecte[achan.npbx+"|"+achan.channel]=1;
		if(typeof(this.achannelarrive[achan.npbx+"|"+achan.channel])!="undefined"){
			delete this.achannelarrive[achan.npbx+"|"+achan.channel];
			this.faddnbnonaffecte(-1);
		}else if(achan.tp==1)this.faddnbencours(1);
	}

}

//fsetchanneldissuade============================================================
csv_calls.prototype.fsetchanneldissuade=function(achan){
  if(typeof(this.achanneldissuade[achan.npbx+"|"+achan.channel])=="undefined"){
  	this.achanneldissuade[achan.npbx+"|"+achan.channel]=1;
  	if(this.initial==0)this.faddnbdissuade(1);
  	if(typeof(this.achannelarrive[achan.npbx+"|"+achan.channel])!="undefined"){
  		this.fsetchannelhistorique(achan);
      delete this.achannelarrive[achan.npbx+"|"+achan.channel];
  	}else if(typeof(this.achannelaffecte[achan.npbx+"|"+achan.channel])!="undefined"){
  		this.fsetchannelhistorique(achan);
      delete this.achannelaffecte[achan.npbx+"|"+achan.channel];
  	}
  }
}

//fsetchannelsoustrait============================================================
csv_calls.prototype.fsetchannelsoustrait=function(achan){
  	//this.achannel[achan.npbx+"|"+achan.channel].fdisplay(this.hsoustrait,achan);
	if(typeof(this.achannelsoustrait[achan.npbx+"|"+achan.channel])=="undefined"){
    this.achannelsoustrait[achan.npbx+"|"+achan.channel]=1;
    if(typeof(this.achannelarrive[achan.npbx+"|"+achan.channel])!="undefined"){
  		delete this.achannelarrive[achan.npbx+"|"+achan.channel];
  		this.faddnbnonaffecte(-1);
  	}else if(typeof(this.achannelaffecte[achan.npbx+"|"+achan.channel])!="undefined"){
  		delete this.achannelaffecte[achan.npbx+"|"+achan.channel];
  	}else if(achan.tp==1)this.faddnbencours(1);
  }

}

//fsetchannelhistorique=============================================================
csv_calls.prototype.fsetchannelhistorique=function(achan){
	if(this.achannelhistorique && typeof(this.achannelhistorique[achan.npbx+"|"+achan.channel])=="undefined"){
		this.achannelhistorique[achan.npbx+"|"+achan.channel]=1;
		if(typeof(this.achannelaffecte[achan.npbx+"|"+achan.channel])!="undefined"){
			if(achan.tp==1 && this.initial==0)this.faddnbencours(-1);
			delete this.achannelaffecte[achan.npbx+"|"+achan.channel];
			if(achan.tp==1 && achan.bridged==1 && achan.bridged){
				if(this.initial==0) this.faddnbtraite(1);//nb d'appel total trait� aujourd'hui
				if(this.atagent[achan.n_contact]){
					this.atagent[achan.n_contact].faddnbapp(1,achan.dte_start,achan.dte_modif); //nb d'appel tot traite par t�l�cons
				}
			}
		}
		if(typeof(this.achannelarrive[achan.npbx+"|"+achan.channel])!="undefined"){
			delete this.achannelarrive[achan.npbx+"|"+achan.channel];
			if(this.initial==0 && achan.tp==1)this.faddnbencours(-1);
			if(this.initial==0) this.faddnbnonaffecte(-1);
		}

		if(typeof(this.achannelsoustrait[achan.npbx+"|"+achan.channel])!="undefined"){
			delete this.achannelsoustrait[achan.npbx+"|"+achan.channel];
			if(this.initial==0 && achan.tp==1)this.faddnbencours(-1);
		}
	}

	this.achannel[achan.npbx+"|"+achan.channel].fdelete();
}

//fsetchannelperdu==============================================================
csv_calls.prototype.fsetchannelperdu=function(achan){
  if(!this.achannel[achan.npbx+"|"+achan.channel]) return;
  if(typeof(this.achannelperdu[achan.npbx+"|"+achan.channel])=="undefined"){
		//this.achannel[achan.npbx+"|"+achan.channel].fcopy(this.hperdus);
		this.achannelperdu[achan.npbx+"|"+achan.channel]=1;
		if(this.initial==0)this.faddnbperdu(1);
		if(typeof(this.achannelarrive[achan.npbx+"|"+achan.channel])!="undefined"){
			delete this.achannelarrive[achan.npbx+"|"+achan.channel];
		}
		if(typeof(this.achannelaffecte[achan.npbx+"|"+achan.channel])!="undefined"){
			delete this.achannelaffecte[achan.npbx+"|"+achan.channel];
		}
	}
}

//fdeletechannel=====================================================================
csv_calls.prototype.fdeletechannel=function(achan){
  var n=achan.npbx+"|"+achan.channel;
  if(typeof(this.achannelperdu[n])!="undefined"){
    delete this.achannelperdu[n];
    if(this.initial==0 && achan.tp==1) this.faddnbperdu(-1);
  }
  if(typeof(this.achannelarrive[n])!="undefined"){
    delete this.achannelarrive[n];
    if(this.initial==0 && achan.tp==1) this.faddnbnonaffecte(-1);
    if(this.initial==0 && achan.tp==1) this.faddnbencours(-1);
  }
  if(typeof(this.achannelsoustrait[n])!="undefined"){
    delete this.achannelsoustrait[n];
    if(this.initial==0 && achan.tp==1) this.faddnbencours(-1);
  }
  if(typeof(this.achannelaffecte[n])!="undefined"){
    delete this.achannelaffecte[n];
    if(this.initial==0 && achan.tp==1) this.faddnbencours(-1);
  }
  if(typeof(this.achanneldissuade[n])!="undefined"){
    delete this.achanneldissuade[n];
    if(this.initial==0 && achan.tp==1) this.faddnbdissuade(-1);
  }
  if(typeof(this.achannel[n])!="undefined"){
    this.achannel[n].fdelete();
    delete this.achannel[n];
  }
}

//faddnbnonaffecte====================================================================
csv_calls.prototype.faddnbnonaffecte=function(nb){
	this.nbnonaffecte=this.nbnonaffecte+nb*1;
	this.hnbnonaffecte.innerHTML=this.nbnonaffecte
}

//faddnbperdu====================================================================
csv_calls.prototype.faddnbperdu=function(nb){
	this.nblost=this.nblost+nb*1;
	this.hnblost.innerHTML=this.nblost;
}

//faddnbtraite====================================================================
csv_calls.prototype.faddnbtraite=function(nb){
	this.nbdays=this.nbdays+nb*1;
	this.hnbday.innerHTML=this.nbdays;
}

//faddnbdissuade==================================================================
csv_calls.prototype.faddnbdissuade=function(nb){
	this.nbdissuade=this.nbdissuade+nb*1;
	this.hnbdissuade.innerHTML=this.nbdissuade;
}

//faddnbencours===================================================================
csv_calls.prototype.faddnbencours=function(nb){
	this.nbcours=this.nbcours+nb*1;
	this.hnbcours.innerHTML=this.nbcours;
}

//fdelete============================================================
csv_calls.prototype.fdelete=function(){
	for(var i in this.atagent){  //vider les agents
		this.atagent[i].fdelete();
		delete this.atagent[i];
	}

	this.initial=1;
	this.nbdays=0;//nb d'appel total sur la journ�e
	this.nblost=0;//nb d'appel perdu
	this.nbdissuade=0;//nb d'appel dissuade
	this.nbcours=0; //nb d'appel en cours
	this.nbnonaffecte=0; //nb d'appel en hnbnonaffecte
	this.nsoc=-1;
	this.nqueue=-1;
	if(this.hagent)this.hagent.innerHTML='';
	if(this.hnbnonaffecte)this.hnbnonaffecte.innerHTML='0';
	if(this.hnbcours)this.hnbcours.innerHTML='0';

	if(this.timer) clearTimeout(this.timer);
	this.timer=null;

	this.atagent=new Array();
	this.lastcheckid="";
	this.lastcheckidagent="";
	this.achannel=new Array();
	this.achannelarrive=new Array();
	this.achannelperdu=new Array();
	this.achanneldissuade=new Array();
	this.achannelaffecte=new Array();
	this.achannelhistorique=new Array();
	this.achannelsoustrait=new Array();
	this.aqueue=new Array(); //tableau des groupes d'appel affiche
	this.acontact=new Array();
	this.lagent="";
	this.nbagent=0;
}
