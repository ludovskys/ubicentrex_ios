function csearch(_ref,_pref,_oparent){
	this.ref=_ref;
	this.pref=_pref;
	this.oparent=_oparent;
	this.ncli=this.oparent.n;
	this.nsoc=this.oparent.nsoc;
	
	this.vfltype=0;
	this.vapartir=0;
	this.stp="agenda";
}

csearch.prototype.fdisplay=function(_target_ctn){
	if(_target_ctn)this.target_ctn=_target_ctn;
	if(!this.target_ctn)return false;

	if(!this.hctn){
		this.hctn=document.createElement('div');
		this.hctn.id="srch_ctn_"+this.ncli;
		this.hctn.className='bdiv scr';
		this.target_ctn.appendChild(this.hctn);
		
		//agenda==============
		var tx="<table id='"+this.pref+"tbrdv' class='struct'>";
		tx+="<tr><td>"+text(this.pref+"txrdv","","placeholder='Chercher un rendez-vous...'",'',"search")+"</td></tr>";
		tx+="<tr><td id='"+this.pref+"res_rdv'></td></tr>";
		tx+="</table>";
		
		//message==============
		tx+="<table id='"+this.pref+"tbmsg' class='struct' style='display:none;'>";
		tx+="<tr><td>"+text(this.pref+"txmsg","","placeholder='Chercher un message...'",'',"search")+"</td></tr>";
		tx+="<tr><td id='"+this.pref+"res_msg'></td></tr>";
		tx+="</table>";

		this.hctn.innerHTML=tx;
		this.tbrdv=document.getElementById(this.pref+"tbrdv");
		this.tbmsg=document.getElementById(this.pref+"tbmsg");
		this.hres_rdv=document.getElementById(this.pref+"res_rdv");
		this.hres_msg=document.getElementById(this.pref+"res_msg");
		
		this.txrdv=document.getElementById(this.pref+"txrdv");
		this.txmsg=document.getElementById(this.pref+"txmsg");
	}
}
/*<post>
	<soapmethod><![CDATA[messagerie]]></soapmethod>
	<act><![CDATA[list]]></act>
	<msg_gen><![CDATA[0]]></msg_gen>
	<ncli><![CDATA[5431384]]></ncli>
	<fl_lu><![CDATA[6]]></fl_lu>
	<fl_recu><![CDATA[3]]></fl_recu>
	<fl_apartir><![CDATA[0]]></fl_apartir>
	<fltxt><![CDATA[rose]]></fltxt>
	<fl_cat><![CDATA[]]></fl_cat>
	<fl_important><![CDATA[1]]></fl_important>
	<sessionname><![CDATA[]]></sessionname>
</post>*/
csearch.prototype.fsearch=function(){
	switch(this.stp){
		case "agenda":
			if(this.txrdv.value.length<3){
				ftoast("Veuillez saisir au moins 3 caractères pour effectuer la recherche.");
				return;
			}
			var req={
					soapmethod:"agenda",
					act:"search",
					rech:this.txrdv.value,
					n_client:this.ncli,
					tp_rech:0,
					aff_rdv_suppr:0
				}
			soap.call(req, this.fsearch_agenda_clb,this,this.fsearch_agenda_ofl_clb);
		break;
		case "message":
			if(this.txmsg.value.length<3){
				ftoast("Veuillez saisir au moins 3 caractères pour effectuer la recherche.");
				return;
			}
			var req={
					soapmethod:"messagerie",
					act:"list",
					msg_gen:0,
					ncli:this.ncli,
					fl_lu:6,
					fl_recu:3,
					fl_apartir:0,
					fl_cat:'',
					fltxt:this.txmsg.value,
					fl_important:1
				}
			soap.call(req, this.fsearch_message_clb,this,this.fsearch_message_ofl_clb);
		break;
	}
	fshow_loading();
}

csearch.prototype.fsearch_agenda_clb=function(r,rt,myobj){
	fcancel_loading();
	if(!r)return;
	var xrdvs=r.selectNodes("./rdvs/rdv");
	var tx="";
	for(var i=0;i<xrdvs.length;i++){
		var ardv=xmltag2array(xrdvs[i]);
		tx+=myobj.fafficher_un_rdv(ardv);
	}
	if(!tx)tx="Pas de résultat trouvé.";
	myobj.hres_rdv.innerHTML=tx;
}

csearch.prototype.fsearch_agenda_ofl_clb=function(myobj){
	var qry="select * from ncb_crm_actions " +
			"where n_crm_clients="+myobj.ncli+" and (objet like \""+myobj.txrdv.value+"%\" or objet like \"% "+myobj.txrdv.value+"%\") " +
			"order by ddeb desc limit 0,300";
	odb.query(qry,myobj,myobj.fsuccess_get_local_rdv_clb);
}

csearch.prototype.fsuccess_get_local_rdv_clb=function(myobj,p){
	fcancel_loading();
	if(!p)p=new Array();
	var tx="";
	for(var i=0;i<p.length;i++){
		var ardv=p[i];
		tx+=myobj.fafficher_un_rdv(ardv);
	}
	if(!tx)tx="Pas de résultat trouvé.";
	myobj.hres_rdv.innerHTML=tx;
}

csearch.prototype.fafficher_un_rdv=function(ardv){
	var dtd=my2jd(ardv.ddeb);
	var dtf=my2jd(ardv.dfin);
	var txp=jd2fr2(dtd)+"<br>à "+h2my(dtd);
	var txt="<div style='position:relative;border-bottom:1px solid #eee;width:100%;height:30px;line-height:30px;overflow:hidden;'>" +
		"<div style='font-size:14px;font-weight:bold;position:relative;float:left;width:65%;overflow:hidden;height:30px;line-height:30px;'>"+ardv.objet+"</div>" +
		"<div style='font-size:11px;color:blue;position:relative;float:right;height:100%;height:30px;line-height:15px;'>"+txp+"</div></div>";
	return txt;
}

csearch.prototype.fsearch_message_clb=function(r,rt,myobj){
	fcancel_loading();
	if(!r)return;
	var xmsgs=r.selectNodes("./wfls/wfl");
	var tx="";
	for(var i=0;i<xmsgs.length;i++){
		var amsg=xmltag2array(xmsgs[i]);
		tx+=myobj.fafficher_un_msg(amsg);
	}
	myobj.hres_msg.innerHTML=tx;
}

csearch.prototype.fsearch_message_ofl_clb=function(myobj){
	var qry="select * from ncb_crm_messages " +
			"where n_crm_clients="+myobj.ncli+" and (objet like \""+myobj.txmsg.value+"%\" or objet like \"% "+myobj.txmsg.value+"%\") " +
			"order by date_creation desc limit 0,300";
	odb.query(qry,myobj,myobj.fsuccess_get_local_message_clb);
}

csearch.prototype.fsuccess_get_local_message_clb=function(myobj,p){
	fcancel_loading();
	if(!p)p=new Array();
	var tx="";
	for(var i=0;i<p.length;i++){
		var ardv=p[i];
		tx+=myobj.fafficher_un_msg(ardv);
	}
	if(!tx)tx="Pas de résultat trouvé.";
	myobj.hres_msg.innerHTML=tx;
}


csearch.prototype.fafficher_un_msg=function(amsg){
	var reg = new RegExp("[: -]", "g");
    var reg1 = new RegExp("\n", "g");
    var reg2 = new RegExp("[|]", "g");
    // couleur du fond en fonction du type d'emetteur
    if (typeof (amsg.ldroitsut) != "undefined") var adroitus = amsg.ldroitsut.split(',');
    else adroitus = new Array();
    var txt = "<table style='width:100%;margin-top:1px;";
    if (!in_array(4, adroitus) && in_array(26, adroitus) && amsg.n_crm_clients != this.ncli) {
        // secretaire : vert
        txt += "background-color:#a0ee7d;";
    }else if (in_array(21, adroitus) && amsg.n_utilisateurs == amsg.n_crm_clients) {
        // teleconseiller au téléconseiller : jaune
        txt += "background-color:#ffe659;";
    }else if (amsg.n_utilisateurs == amsg.n_crm_clients) {
        // client : blanc
    	txt += "background-color:#eee;";
    } else {
        // mes messages : bleu
        txt += "background-color:#b5c6e8;";
    }
    // changer les statuts: suprimé,lu et traité
    if (amsg.old * 1 == 1) txt += "color:#636363;text-decoration:line-through;";
    // else if (amsg.trait * 1 == 1 && in_array(21, user_droits)) txt +=
	// "color:#636363;";
    else if (amsg.lu * 1 == 1) txt += "color:#777;";
    else txt += "color:black;";
    txt += "font-size:13px;'>";

    // objet==============
    txt += "<tr><td colspan='2' style='text-align:left;font-weight:bold;'>";
    if (+amsg.important == 1) txt += "<font style='color:red;'>!</font> ";
    txt += "<img src='img/"+(amsg.lu==0 ? "email.png" : "email_open.png")+"' height=15 width=15 /> "+(amsg.msg_cat != "" ? "<u>" + amsg.msg_cat + "</u>&nbsp;" : "")+amsg.objet;
    txt += "</td></tr>";


    // info du contact====
    txt += "<tr><td style='font-size:12px;width:60%;'>";
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
    txt += "<td style='text-align:right;font-size:11px;'>";
    var ardc = amsg.date_creation.split(reg);
    txt += "Le " + ardc[2] + "/" + ardc[1] + "/" + ardc[0] + " à " + ardc[3] + "H" + ardc[4]+"<br />";
    if(amsg.n_utilisateurs==this.ncli)txt += "À " + recepteur;
    else txt += "De " + emetteur;
    txt += "</td>";
    txt + "</tr>";

    //contenue message===============
    var ar_ctn = amsg.txt.split(reg2);
    txt += "<tr><td colspan='2' style='font-style:italic;'>"+ar_ctn[0]+"</td></tr>";

    txt += "</table>";
    return txt;
}

csearch.prototype.fonsrchchange=function(v){
	var hmn=document.getElementById(this.pref+"ag_select")
	switch(v){
		case 0:
			hmn.innerHTML='Rendez-vous';
			this.tbrdv.style.display='';
			this.tbmsg.style.display='none';
			this.stp="agenda";
		break;
		case 1: 
			hmn.innerHTML='Messages';
			this.tbrdv.style.display='none';
			this.tbmsg.style.display='';
			this.stp="message";
		break;
	}
}

csearch.prototype.fsrch_menu=function(obj){
	var tx="<div class='select_item' onclick=\""+this.ref+".fonsrchchange(0);fback_history();\">Rendez-vous</div>";
	tx+="<div class='select_item' onclick=\""+this.ref+".fonsrchchange(1);fback_history();\">Messages</div>";
	fcontext_menu(obj,tx,wwin*0.6);
}
csearch.prototype.fdisplay_header=function(_target_hdr){
	if(_target_hdr)this.target_hdr=_target_hdr;
	if(!this.hhdr){
		//cadre agenda
		this.hhdr=document.createElement('div');
		this.hhdr.id="nl_hdr_"+this.ncli;
		this.hhdr.className='bdiv';
		var tx="<a onClick='"+this.ref+".oparent.oparent.fnav();' class='menu_left'> </a>";
		tx+="<a id='"+this.pref+"ag_select' class='m_select m_select_search' onClick=\""+this.ref+".fsrch_menu(this);\">Rendez-vous</a>";
		tx+="<a onClick='"+this.ref+".fsearch();' class='menu_right menu_right_search'> </a>";
		
		this.hhdr.innerHTML=tx;
		this.target_hdr.appendChild(this.hhdr);
		this.hag_select=document.getElementById(this.pref+"ag_select");
	}
}

csearch.prototype.fshow=function(_aff){
	this.hctn.style.display='';
	this.hhdr.style.display='';
}

csearch.prototype.fhide=function(){
	this.hctn.style.display='none';
	this.hhdr.style.display='none';
}
