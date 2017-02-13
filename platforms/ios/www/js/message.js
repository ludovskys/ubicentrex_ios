function cmessage(_ref,_pref,_oparent){
	this.ref=_ref;
	this.pref=_pref;
	this.oparent=_oparent;
	this.ncli=this.oparent.n;
	this.nsoc=this.oparent.nsoc;
	this.nsoc0=this.oparent.nsoc0;
	
	this.amsgs_sync=new Array();//msgs synced du serveur
	this.amsgs=new Array();//msgs
	
	this.lu=0;//0:nonlu 1:lu 2:tous
	this.old=0;//0:non supprimés 1:supprimés 2:tous
	this.recu=0;//0:reçu 1:envoyé 2:tous
	
	this.allow_scroll_charge=true;//permet de charger msg local quand scroll
	this.allow_refresh=false;
}

cmessage.prototype.finitial=function(){
	fshow_loading();
	this.ajax_div=document.createElement("div");
	this.ajax_div.id=this.pref+"ajax_div";
	this.ajax_div.style.cssText="height:20px;line-height:20px;width:100%;text-align:center;font-size:14px;";
	//initial the last sync time
	this.last_sync=this.oparent.local_config.msg_last_sync;
	//permettre MAJ de la date de dernière sync que pendant initialisation de synchro, redondance pour augmenter la fiabilité
	this.allow_update_last_sync=true;
	
	this.from=0;
	if(this.last_sync!=0){
		this.initial=0;
		this.nbr_a_charger=0;//nbr de msg à charger
		this.fget_local_messages();
		this.ajax_div.innerHTML="Chargement en cours...";
	}else{
		this.initial=1;
		this.nbr_a_charger=-1;
		ftoast("La première synchronisation des messages peut prendre quelques minutes, veuillez patienter...");
		this.fsync_message();
		this.ajax_div.innerHTML="";
	}
}

cmessage.prototype.fget_thms=function(){
	var req={
			soapmethod:'messagerie',
			act:'display',
			nsoc:this.nsoc,
			ncli:this.ncli
		}
	soap.call(req,this.fget_thms_clb,this);
}

cmessage.prototype.fget_thms=function(r,rt,myobj){
	
}

cmessage.prototype.fget_local_messages=function(){
	if(this.nbr_a_charger==-1){
		this.ajax_div.innerHTML="";
		return;
	}
	var qry="select * from ncb_crm_messages where ndossier="+this.ncli;
	if(this.lu!=2)qry+=" and lu="+this.lu;	
	if(this.old!=2)qry+=" and old="+this.old;
	if(this.recu!=2){
		qry+=" and "+(this.recu==0 ? "n_crm_clients=" : "n_utilisateurs=")+this.ncli;
	}	
	qry+=" order by date_creation desc limit "+this.nbr_a_charger+",50";
	odb.query(qry,this,this.fsuccess_get_local_msgs_clb,null,"array");
}

cmessage.prototype.fsuccess_get_local_msgs_clb=function(myobj,p){
	if(!p)p=new Array();
	if(myobj.nbr_a_charger!=0)myobj.hctn.removeChild(myobj.ajax_div);
	for(var i in p){
		var amsg=p[i];
		myobj.fafficher_un_msg(amsg,1);
		myobj.amsgs[amsg.n]=amsg;
	}
	
	myobj.hctn.appendChild(myobj.ajax_div);
	if(myobj.hctn.offsetHeight<myobj.hctn.scrollHeight && p.length==50){
		myobj.nbr_a_charger+=50;
		myobj.ajax_div.innerHTML="Chargement en cours...";
	}else if(p.length<50){//stoper charger msg quand scroll
		myobj.allow_scroll_charge=false;
		myobj.nbr_a_charger=-1;//message locals déjà tous chargés
		myobj.ajax_div.innerHTML="";
	}
	if(!myobj.fsync_timer)myobj.fsync_message();
}

cmessage.prototype.fsync_message=function(){
	console.log("!=============message sync")
	var req={
			soapmethod:'messagerie',
			act:'mobile_sync',
			ncli:this.ncli,
			from:this.from,
			initial:this.initial,
			last_sync:this.last_sync
		}

	if(this.fsync_timer)clearTimeout(this.fsync_timer);
	soap.call(req,this.fsync_message_clb,this);
}

cmessage.prototype.fsync_message_clb=function(r,rt,myobj){
	if(!r)return false;
	var xmsg=r.selectNodes("./rows/row");
	for(var i in xmsg){
		var amsg=xmltag2array(xmsg[i]);
		myobj.fafficher_un_msg(amsg);
		myobj.amsgs_sync.push(amsg);
		myobj.amsgs[amsg.n]=amsg;
	}
	
	if(xmsg.length<3000){
		var qry=new Array();
		if(myobj.initial){
			setTimeout("ftoast('Fin de synchronisation.',5000)",1500);
			qry.push("delete from ncb_crm_messages where ndossier="+myobj.ncli);
			myobj.hctn.appendChild(myobj.ajax_div);
		}
		
		for(var i in myobj.amsgs_sync){
			var amsg=myobj.amsgs_sync[i];
			qry.push(insert_qry("ncb_crm_messages",amsg,true));
		}
		
		myobj.last_sync=r.selectSingleNode("./dteqry/@dteqry").nodeValue;
		if(myobj.allow_update_last_sync){
			qry.push("update ncb_local_config set msg_last_sync='"+myobj.last_sync+"' where ncli="+myobj.ncli);
			myobj.allow_update_last_sync=false;
		}		
		odb.query(qry,myobj);		
		var interval=myobj.oparent.local_config.interval_msg;
		myobj.fsync_timer=setTimeout(myobj.ref+".fsync_message()",interval*60*1000);
		
		//vider les tableaux et reinisaliser les params pour la prochaine sync
		myobj.initial=0;
		myobj.from=0;
		myobj.amsgs_sync=new Array();
		setTimeout("fcancel_loading()",2000);
	}else{
		myobj.from=myobj.from + xmsg.length;
		myobj.fsync_timer=setTimeout(myobj.ref+".fsync_message()",3000);
	}	
}

cmessage.prototype.fresync=function(){
	fshow_loading();
	ftoast("Resynchronisation des messages en cours, cela peut prendre quelques minutes, veuillez patienter...",5000);
	this.amsgs=new Array();
	this.last_sync=0;
	this.allow_update_last_sync=true;
	this.from=0;
	this.initial=1;
	this.fsync_message();
}

cmessage.prototype.fafficher_un_msg=function(amsg,where){
	var old_msg=document.getElementById(this.pref+amsg.n);
	if(old_msg)old_msg.parentNode.removeChild(old_msg);
	if(amsg.lu!=this.lu && this.lu!=2)return false;
	if(amsg.old!=this.old && this.old!=2)return false;


	if(this.recu!=2){
		if(this.recu==0 && (amsg.n_crm_clients!=amsg.ndossier || amsg.n_crm_clients == amsg.n_utilisateurs))return false;
		if(this.recu==1 && (amsg.n_crm_clients==amsg.ndossier && amsg.n_crm_clients != amsg.n_utilisateurs))return false;
	}
	
	var dm=document.createElement("div");
	dm.id=this.pref+amsg.n;
	dm.style.cssText="border-bottom:1px solid lightgray;";

	var txt = getHTMLFromMessage(amsg, "<table onClick='"+this.ref+".fshow_detail_msg("+amsg.n+")'");
    
	dm.innerHTML=txt;
	var dm_old=document.getElementById(dm.id);
	if(dm_old)this.hctn.replaceChild(dm,dm_old);
	else if(typeof(where)!='undefined' && where==1)this.hctn.appendChild(dm);
	else this.hctn.insertBefore(dm,this.hctn.firstChild);
	
	return true;
}

cmessage.prototype.fshow_detail_msg=function(n){
	if(!this.amsgs[n])return false;
	var amsg=this.amsgs[n];
	var a=new Array();
	
	a["header"]="<a onClick=\"fback_history();\" class='menu_left menu_left_back'> </a>";
	
	if(amsg.old!=1)a["header"]+="<a onClick=\""+this.ref+".fsupp_msg();\" class='menu_right menu_right_trash'> </a>";
	
	//"+(amsg.lu==0?'N':'L')+"
	a["header"]+="<a onClick=\""+this.ref+".fpass_lu();\" id='"+this.pref+"lu_icon' class='menu_right menu_right_lu'></a>";
	a["header"]+="<a onClick=\""+this.ref+".fnew_msg("+n+");\" class='menu_right menu_right_forward'> </a>";
	
	this.actif_msg=amsg;
	var reg = new RegExp("[: -]", "g");
    var reg1 = new RegExp("\n", "g");
    var reg2 = new RegExp("[|]", "g");

    if (typeof (amsg.ldroitsut) != "undefined") var adroitus = amsg.ldroitsut.split(',');
    else adroitus = new Array();
    if (!in_array(4, adroitus) && in_array(26, adroitus) && amsg.n_crm_clients != user.n) {
        //secretaire : vert
    	var bkg="#a0ee7d;";
    }else if (in_array(21, adroitus) && amsg.n_utilisateurs == amsg.n_crm_clients) {
        //teleconseiller au téléconseiller : jaune
    	var bkg="#ffe659;";
    }else if (amsg.n_utilisateurs == amsg.n_crm_clients ) {
        //client : bleu
    	var bkg="#f2f2f2;";
    } else {
        //mes messages : blanc
    	var bkg="#b5c6e8;";
    }
	
	var tdMessageObjetClassNames = getClassMessage(amsg);

	a["content"] = "<table class='tableMessage'>";
    // objet==============
	a["content"] += "<tr style='height:18px;'><td colspan='2' class='tdMessageObjet "+tdMessageObjetClassNames+"'>";
    if (+amsg.important == 1) a["content"] += "<font style='color:red;'>!</font> ";
    a["content"] += (amsg.msg_cat != "" ? "<u>" + amsg.msg_cat + "</u>&nbsp;" : "") + amsg.objet;
    a["content"] += "</td></tr>";

    a["content"] += "<tr style='height:30px;'>";
    // info du contact======
    if (amsg.lco) {
    	a["content"] += "<td class='tdMessageInfosContact'>";
        var tt = "";
        if (amsg.co_dte_naissance && amsg.co_dte_naissance!='') tt += "Né(e) le " + mytodfr(amsg.co_dte_naissance) + "<br/>";
        if (amsg.co_mail1) tt += "Email : <a href=mailto:"+amsg.co_mail1+">" + amsg.co_mail1 + "</a> <br/>";
        if (amsg.co_tel_mobile) tt += "Tél M. : "+tel_url(amsg.co_tel_mobile)+"<br/>";
        if (amsg.co_tel_pri) tt += "Tél Pri : "+tel_url(amsg.co_tel_pri)+"<br/>";
        if (amsg.co_tel_pro) tt += "Tél Prof : "+tel_url(amsg.co_tel_pro)+"<br/>";
        if (amsg.co_tel_adsl) tt += "Tél Adsl : "+tel_url(amsg.co_tel_adsl)+"<br/>";

        if (amsg.emplacement) tt += "No. d'appelant : "+tel_url(amsg.emplacement)+"<br/>";
        a["content"] += tt;
        a["content"] += "</td>";
    }

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

        a["content"] += "<td class='tdMessageEmetteurRecepteur'>";
        var ardc = amsg.date_creation.split(reg);
        a["content"] += "Le " + ardc[2] + "/" + ardc[1] + "/" + ardc[0] + " à " + ardc[3] + "H" + ardc[4]+"<br />";
        if(amsg.n_utilisateurs==this.ncli)a["content"] += "A " + "<b>"+ recepteur + "</b>";
        else a["content"] += "De " +  "<b>" + emetteur + "</b>";
        a["content"] += "</td>";
    }
    a["content"] + "</tr>";

    // txt
    a["content"] += "<tr><td colspan='2'><div class='divMessageContentFull'>";
    var ar_ctn = amsg.txt.split(reg2);
    if(amsg.lpj){
    	var uri = soapurl+"pages/docdisplay.php?nsoc0=" + (this.nsoc0==0 ? this.nsoc : this.nsoc0) + "&nsoc=" + this.nsoc + "&ndoc=" + amsg.lpj;
    	var apjn=amsg.lpj_name.split(".");
    	var ext=apjn[apjn.length-1];
    	a["content"] += "<br><a href='#' onClick=\"fdownload_file('"+uri+"','docubi"+amsg.lpj+"."+ext+"')\">" + amsg.lpj_name + "</a>";
    }
    a["content"] += ar_ctn[0]+"</div></td></tr>";
    a["content"] += "</table>";
    
    fnew_page(a,'right');
}

cmessage.prototype.fsupp_msg=function(){
	fconfirm("Êtes-vous sûr de vouloir supprimer définitivement ce message ?",this.ref+".fsupp_msg2()");
}

cmessage.prototype.fsupp_msg2=function(n){
	if(!n)n=this.actif_msg.n;
	var req={
		soapmethod:'workflow',
		act:'delete',
		val:1,
		n_action:n
	}
	soap.call(req, this.fsupp_msg_clb, this);
}

cmessage.prototype.fsupp_msg_clb=function(r,rt,myobj,p){
	if(!r)return;
	var n=r.selectSingleNode("n_action/text()").nodeValue;
	if(!n){
		ftoast("Erreur lors de la suppression du message.");
		return;
	}
	ftoast("Le message a été supprimé.");
	if(anbrmsg["n"+myobj.ncli]!=0)anbrmsg["n"+myobj.ncli]--;
	setTimeout("fback_history('')",200);
	myobj.fsync_message();
}

cmessage.prototype.fpass_lu=function(){
	if(this.actif_msg.n_utilisateurs==this.ncli){
		var req={
				soapmethod:'infobulle',
				act:'msg',
				bulle_ib:"soap:msg,nact:"+this.actif_msg.n,
				ncli:this.ncli,
				nact:this.actif_msg.n
			}
	}else{
		var lu=0;
		if(this.actif_msg.lu==0)lu=1;
		else lu=0;
		var req={
			soapmethod:'workflow',
			act:'lu',
			n_action:this.actif_msg.n,
			val:lu
		}
	}
	
	soap.call(req,this.fpass_lu_clb,this);
}

cmessage.prototype.fpass_lu_clb=function(r,rt,myobj,p){
	if(!r)return;
	if(p.soapmethod=='infobulle'){
		var xhist = r.selectSingleNode("infobulle/text()");
		var txt=br2nl(xhist.nodeValue)
		if(!trim(txt))txt="Pas de mouvement historique";
		ftoast(txt,5000);
	}else{
		var xmsg = r.selectSingleNode("wfls/wfl");
		var amsg=xmltag2array(xmsg);
		myobj.actif_msg=amsg;
		myobj.amsgs[amsg.n]=amsg;
		
		var dic=document.getElementById(myobj.pref+"lu_icon");
		if(amsg.lu==0){
			ftoast("Vous avez passé le message à non lu.",4000);
			anbrmsg["n"+myobj.ncli]++;
		}else{
			ftoast("Vous avez passé le message à lu.",4000);
			if(anbrmsg["n"+myobj.ncli]!=0)anbrmsg["n"+myobj.ncli]--;
		}
		myobj.fsync_message();
	}
	
}

cmessage.prototype.fscroll=function(e){
	if(this.hctn.scrollTop<=0){
		e.preventDefault();
		return false;
	}
	
	this.allow_refresh=false;
	if(!this.allow_scroll_charge || this.hctn.offsetHeight>=this.hctn.scrollHeight)return;
	if(this.hctn.scrollTop+this.hctn.offsetHeight>this.hctn.scrollHeight-20)this.fget_local_messages();
}

cmessage.prototype.ftouchstart=function(e){
	this.hctn.className='bdiv scr divMessage';
	this.hctn.style.WebkitTransform="translate3d(0,0,0)";
	this.himg.style.WebkitTransform="rotate(0deg)";
	if(this.hctn.scrollTop<=0)this.allow_refresh=true;
	else this.allow_refresh=false;
	
	this.movetop=0;
	this.offsetY=e.touches[0].pageY;
	this.offsetX=e.touches[0].pageX;
	return false;
}

cmessage.prototype.ftouchmove=function(e){
	if(!this.allow_refresh)return false;
	this.movetop=(e.touches[0].pageY-this.offsetY)/4;
	if(this.movetop<=0 || Math.abs(e.touches[0].pageY-this.offsetY)<=2*Math.abs(e.touches[0].pageX-this.offsetX)){
		this.allow_refresh=false;
		this.hctn.className='bdiv scr transition divMessage';
		this.hctn.style.WebkitTransform="translate3d(0,0,0)";
		this.himg.style.WebkitTransform="rotate(0deg)";
		return false;
	}
	e.preventDefault();
	this.himg.style.display='';
	if(this.movetop>80)this.movetop=80;
	this.hctn.style.WebkitTransform="translate3d(0,"+this.movetop+"px,0)";
	
	var deg=Math.ceil(this.movetop/80*180);
	this.himg.style.WebkitTransform="rotate("+deg+"deg)";
	return false;
}

cmessage.prototype.ftouchend=function(e){
	this.himg.style.display='none';
	if(!this.allow_refresh)return false;
	this.hctn.className='bdiv scr transition divMessage';
	this.hctn.style.WebkitTransform="translate3d(0,0,0)";
	this.himg.style.WebkitTransform="rotate(0deg)";
	this.allow_refresh=false;
	if(this.movetop>=50){
		fshow_loading();
		this.fsync_message();
	}
	return false;
}

cmessage.prototype.fmsg_filtre=function(obj){
	var f1=0,f2=0;
	if(this.old==0 && this.lu==0)f1=0;
	else if(this.old==0 && this.lu==1)f1=1;
	else if(this.old==0 && this.lu==2)f1=2;
	else if(this.old==1 && this.lu==2)f1=3;
	else if(this.old==2 && this.lu==2)f1=4;
	
	if(this.recu==0)f2=0;
	else if(this.recu==1)f2=1;
	else if(this.recu==2)f2=2;
	
	var tx="<div class='select_item "+(f1==0 ? "selected":"")+"' onclick=\""+this.ref+".lu=0;"+this.ref+".old=0;fback_history();"+this.ref+".frafficher_msgs('Non lus');\">Non lus</div>";
	tx+="<div class='select_item "+(f1==1 ? "selected":"")+"' onclick=\""+this.ref+".lu=1;"+this.ref+".old=0;fback_history();"+this.ref+".frafficher_msgs('Lus');\">Lus</div>";
	tx+="<div class='select_item "+(f1==2 ? "selected":"")+"' onclick=\""+this.ref+".lu=2;"+this.ref+".old=0;fback_history();"+this.ref+".frafficher_msgs('Tous sauf supprimés');\">Tous sauf supprimés</div>";
	tx+="<div class='select_item "+(f1==3 ? "selected":"")+"' onclick=\""+this.ref+".lu=2;"+this.ref+".old=1;fback_history();"+this.ref+".frafficher_msgs('Supprimés');\">Supprimés</div>";
	tx+="<div class='select_item "+(f1==4 ? "selected":"")+"' onclick=\""+this.ref+".lu=2;"+this.ref+".old=2;fback_history();"+this.ref+".frafficher_msgs('Tous');\">Tous</div>";
	tx+="<div class='select_item' style='border:0;height:10px;background:#ddd;'></div>";
	tx+="<div class='select_item "+(f2==0 ? "selected":"")+"' onclick=\""+this.ref+".recu=0;fback_history();"+this.ref+".frafficher_msgs('Reçus');\">Reçus</div>";
	tx+="<div class='select_item "+(f2==1 ? "selected":"")+"' onclick=\""+this.ref+".recu=1;fback_history();"+this.ref+".frafficher_msgs('Envoyés');\">Envoyés</div>";
	tx+="<div class='select_item "+(f2==2 ? "selected":"")+"' onclick=\""+this.ref+".recu=2;fback_history();"+this.ref+".frafficher_msgs('Tous');\">Tous</div>";
	fcontext_menu(obj,tx,wwin*0.6);
}

cmessage.prototype.frafficher_msgs=function(txtSelected){
	
	this.hag_select.innerHTML = txtSelected;
	
	this.allow_scroll_charge=true;
	this.hctn.innerHTML="";
	this.hctn.scrollTop=0;
	this.nbr_a_charger=0;
	this.fget_local_messages();
	this.hctn.appendChild(this.ajax_div);
}

cmessage.prototype.fnew_msg=function(n){
	var amsg=null;
	if(n)amsg=this.amsgs[n];
	var a=new Array();
	a["header"]="<a onClick=\"fback_history();\" class='menu_left menu_left_back'> </a>";
	a["header"]+="<a onClick=\""+this.ref+".fsend();\" class='menu_right menu_right_send'> </a>";
	a["content"]="<table style='position:absolute;' class='struct'>";
	var pajax=new Array();
	pajax.placeholder="À";
	pajax.min_len=1;
	pajax.v="";
	pajax.main_key="v2";
	pajax.req={
    	soapmethod : 'sql',
        idqry : 'receiver',
        ncli : this.ncli
    }
	pajax.flist_item=function(aval){
		var tx="<img style='height:100%;width:auto;position:relative;top:0;left:0;float:left;' src='img/user.png' />";
		tx+="<div style='height:25px;line-height:25px;font-size:16px;position:relative;top:0;left:0;'>"+aval.v1+"</div>";
		return tx;
	}
	
	pajax.selected_values=new Array();
	if(amsg){
		if(amsg.n_utilisateurs==this.ncli || amsg.ut_societe!=this.nsoc)pajax.selected_values[user.n]={v1:"La permanence téléphonique",v2:user.n};
		else pajax.selected_values[amsg.n_utilisateurs]={v1: amsg.ut_nom_usuel,v2:amsg.n_utilisateurs};
	}else pajax.selected_values[user.n]={v1:"La permanence téléphonique",v2:user.n};
	
	pajax.asupval=new Array();
	pajax.asupval[0]={v1:"Tous",v2:-1};
	pajax.asupval[1]={v1:"La permanence téléphonique",v2:user.n};
	
	pajax.outputs={
		v1:	this.pref+"odest_selecta"
	}
	this.odest_selecta=new cmultiselectajax(this.ref+".odest_selecta",this.pref+"odest_selecta",pajax);	
	a["content"]+="<tr><td colspan='2'>"+this.odest_selecta.fcreate()+"</td></tr>";
	
	var pajax2=new Array();
	pajax2.placeholder="Objet";
	pajax2.min_len=2;
	
	if(amsg)pajax2.v="Re:"+amsg.objet;
	else pajax2.v="";
	pajax2.req={
    	soapmethod : 'sql',
        idqry : 'contact',
        ncli : this.ncli
    }
	pajax2.flist_item=function(aval){
		var tx="<img style='height:100%;width:auto;position:relative;top:0;left:0;float:left;' src='img/user.png' />";
		tx+="<div style='height:25px;line-height:25px;font-size:16px;position:relative;top:0;left:0;'>"+aval.v1+"</div>";
		tx+="<div style='height:15px;line-height:15px;font-size:13px;position:relative;top:0;left:0;'>"+tel_url(aval.v3)+"</div>";
		return tx;
	}
	
	pajax2.outputs={
		v1:	this.pref+"ocon_selecta",
		v2: this.pref+"lco",
		v3: this.pref+"emplacement"
	}	
	this.ocon_selecta=new cselectajax(this.ref+".ocon_selecta",this.pref+"ocon_selecta",pajax2);	
	a["content"]+="<tr><td colspan='2'>"+this.ocon_selecta.fcreate()+hidden(this.pref+"lco","lco",(amsg && amsg.lco) ? amsg.lco : 0)+"</td></tr>";
	a["content"]+="<tr><td colspan='2'>"+text(this.pref+"emplacement","","placeholder='Téléphone'",amsg ? ftel_lisible(amsg.emplacement) : "", "number")+"</td></tr>";
	
	var msg_ctn="";
	if(amsg){
		var reg = new RegExp("[: -]", "g");
		var ardc = amsg.date_creation.split(reg);
		msg_ctn="<br>__________________________<br>"+
				amsg.ut_nom_usuel+" a écrit le" + ardc[2] + "/" + ardc[1] + "/" + ardc[0] + " à " + ardc[3] + "H" + ardc[4]+":<br><br>"+amsg.txt;
	}
	a["content"]+="<tr><td colspan='2'>"+textarea(this.pref+"msg_ctn","msg_ctn","placeholder='Composez un message'",msg_ctn)+"</td></tr>";
    fnew_page(a,'right');
}

cmessage.prototype.fsend=function(){
	var ldests=this.odest_selecta.fget_main_values();
	if(!ldests){
		ftoast("Veuillez choisir les destinataires.");
		return;
	}
	var req={};
	req.soapmethod='messagerie';
	req.act='send';
	req.nonfact=0;
	req.imp=0;
	req.ndossier=this.ncli;
	req.ncli=ldests;
	req.lcli=ldests;
	req.msg_cat=125;
	req.msg_objet=document.getElementById(this.pref+"ocon_selecta").value;
	req.msg_ctn=br2nl(document.getElementById(this.pref+"msg_ctn").innerHTML);
	req.lco=document.getElementById(this.pref+"lco").value;
	req.answer=0;
	req.tel_mobile='';
	req.email=0;
	req.mail1='';
	req.emplacement='';
	req.nsoc=this.nsoc;
	soap.call(req, this.fsend_clb, this);
}

cmessage.prototype.fsend_clb=function(r,rt,myobj){
	if(!r)return;
	myobj.fsync_message();
	fback_history('');
	ftoast("Votre message a été envoyé");
}

cmessage.prototype.fdisplay=function(_target_ctn){
	if(_target_ctn)this.target_ctn=_target_ctn;
	if(!this.target_ctn)return false;

	if(!this.hctn){
		//icon refresh
		this.hrefresh=document.createElement('div');
		this.hrefresh.innerHTML="<img src='img/icon_loading.png' style='-webkit-transition:all .25s ease-out;transition:all .25s ease-out;height:28px;display:none;'/>";
		this.hrefresh.style.cssText="position:absolute;Z-index:-1;top:0;left:0;width:100%;height:30px;line-height:30px;text-align:right;";
		this.target_ctn.appendChild(this.hrefresh);
		this.himg=this.hrefresh.firstChild;
		
		//cadre message
		this.hctn=document.createElement('div');
		this.hctn.id="msg_ctn_"+this.ncli;
		this.hctn.setAttribute("onscroll",this.ref+".fscroll(event)");
		this.hctn.setAttribute("ontouchstart",this.ref+".ftouchstart(event)");
		this.hctn.setAttribute("ontouchmove",this.ref+".ftouchmove(event)");
		this.hctn.setAttribute("ontouchend",this.ref+".ftouchend(event)");
		this.hctn.className='bdiv scr divMessage';
		this.target_ctn.appendChild(this.hctn);
	}
}

cmessage.prototype.fdisplay_header=function(_target_hdr){
	if(_target_hdr)this.target_hdr=_target_hdr;
	if(!this.hhdr){
		//cadre agenda
		this.hhdr=document.createElement('div');
		this.hhdr.id="msg_hdr_"+this.ncli;
		this.hhdr.className='bdiv bdivHeader';
		var tx="<a onClick='"+this.ref+".oparent.oparent.fnav();' class='menu_left'> </a>";
		
		tx+="<a id='"+this.pref+"ag_select' class='m_select m_select_messages' onClick=\""+this.ref+".fmsg_filtre(this);\">Non lus</a>";
		tx+="<a onClick=\""+this.ref+".fnew_msg();\" class='menu_right menu_right_newmessage'> </a>";
		
		this.hhdr.innerHTML=tx;
		this.target_hdr.appendChild(this.hhdr);
		this.hag_select=document.getElementById(this.pref+"ag_select");
	}
}

cmessage.prototype.fshow=function(_aff){
	this.hctn.style.display='';
	this.hhdr.style.display='';
	this.hrefresh.style.display='';
}

cmessage.prototype.fhide=function(){
	this.hctn.style.display='none';
	this.hhdr.style.display='none';
	this.hrefresh.style.display='none';
}
