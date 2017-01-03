function cgroup(_ref,_pref,_oparent,_acli){
	this.ref=_ref;
	this.pref=_pref;	
	this.oparent=_oparent;
	for(var i in _acli)this[i]=_acli[i];
	
	this.action="agenda";
	switch(+this.clic_action){
		case 0:
			this.action="agenda";
		break;
		case 2:
			this.action="message";
		break;
		case 4:
			this.action="contact";
		break;
	}
	this.local_config=null;
}

cgroup.prototype.fdisplay=function(_target_page,_action){
	if(_target_page)this.target_page=_target_page;
	if(!this.target_page)return false;

	if(!this.hctn){
		this.hctn=document.createElement('div');
		this.hctn.id="grp_ctn_"+this.n;
		this.hctn.className='bdiv';
		this.target_page.content.appendChild(this.hctn);
	}
	if(!this.hhdr){
		this.hhdr=document.createElement('div');
		this.hhdr.id="grp_hdr_"+this.n;
		this.hhdr.className='bdiv';
		this.target_page.header.appendChild(this.hhdr);
	}
	
	if(this.local_config)this.fshow(_action);
	else setTimeout(this.ref+".fload_local_config()",1000);
}

cgroup.prototype.fload_local_config=function(){
	var qry="select * from ncb_local_config where ncli="+this.n;
	odb.query(qry,this,this.fsuccess_load_local_config_clb,null,"arraysimple");
}

cgroup.prototype.fsuccess_load_local_config_clb=function(myobj,p){
	if(p)myobj.local_config=p;
	else myobj.local_config=new Array();
	myobj.fshow(myobj.action);
}

cgroup.prototype.fshow=function(_action){
	this.hctn.style.display='';
	this.hhdr.style.display='';
	if(this["o"+this.action])this["o"+this.action].fhide();	
	if(_action)this.action=_action;
	
	if(!this["o"+this.action])this.fcreate_action(this.action);
	this["o"+this.action].fshow();
}

cgroup.prototype.fhide=function(){
	this.hctn.style.display='none';
	this.hhdr.style.display='none';
}

cgroup.prototype.fcreate_action=function(_action){
	if(!_action)return false;
	this["o"+_action]=new window["c"+_action](this.ref+".o"+_action,this.pref+"_"+_action,this);
	this["o"+_action].fdisplay(this.hctn);
	this["o"+_action].fdisplay_header(this.hhdr);
	if(this["o"+_action].finitial)this["o"+_action].finitial();
}

cgroup.prototype.fsetting=function(){
	var a=new Array();
	a["header"]="<a onClick=\"fback_history();\" class='menu_left' style=\"background:url('img/arrow_carrot-left.png') no-repeat left center\"> </a>";
	a["header"]+="<div style='position:absolute;right:40px;left:40px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'>"+this.nom_usuel+"</div>";
	a["header"]+="<a onClick=\""+this.ref+".fsetting_save();\" class='menu_right' style=\"background:url('img/icon_check.png') no-repeat center center;background-size:23px auto;\"> </a>";
	a["content"]="<div class='bdiv scr'><table class='struct'>";	
	a["content"]+="<tr><td colspan=2 style='color:#777;font-weight:bold;'>Agenda<hr /></td></tr>";
	var ar=new Array();
	ar["d"]="Afficher le jour";
	ar["w"]="Afficher la semaine";
	ar["m"]="Afficher le mois";
	this.aff_select=new cselect(this.ref+".aff_select",this.pref+"aff_select",ar,this.local_config.ag_aff);
	a["content"]+="<tr><td style='width:45%'>Defaut affichage:</td><td>"+this.aff_select.fcreate()+"</td></tr>";
	ar=new Array();
	ar[5]="Tous les 5 minutes";
	ar[10]="Tous les 10 minutes";
	ar[20]="Tous les 20 minutes";
	ar[30]="Tous les 30 minutes";
	ar[60]="Tous les 60 minutes";
	this.sync_ag_select=new cselect(this.ref+".sync_ag_select",this.pref+"sync_ag_select",ar,this.local_config.interval_ag);
	a["content"]+="<tr><td style='width:45%'>Synchroniser :</td><td>"+this.sync_ag_select.fcreate()+"</td></tr>";
	a["content"]+="<tr><td colspan=2><br>"+button(this.pref+'btn_sync_ag',"","onClick=\""+this.ref+".fresync('agenda')\"","Resynchroniser agenda")+"</td></tr>";	
	a["content"]+="<tr><td colspan=2 style='color:#777;font-weight:bold;'><br>Messages<hr /></td></tr>";
	this.sync_msg_select=new cselect(this.ref+".sync_msg_select",this.pref+"sync_msg_select",ar,this.local_config.interval_msg);
	a["content"]+="<tr><td style='width:45%'>Synchroniser :</td><td>"+this.sync_msg_select.fcreate()+"</td></tr>";
	a["content"]+="<tr><td colspan=2><br>"+button(this.pref+'btn_sync_msg',"","onClick=\""+this.ref+".fresync('message')\"","Resynchroniser messages")+"</td></tr>";
	a["content"]+="<tr><td colspan=2 style='color:#777;font-weight:bold;'><br>Contacts<hr /></td></tr>";
	this.sync_con_select=new cselect(this.ref+".sync_con_select",this.pref+"sync_con_select",ar,this.local_config.interval_con);
	a["content"]+="<tr><td style='width:45%'>Synchroniser :</td><td>"+this.sync_con_select.fcreate()+"</td></tr>";
	a["content"]+="<tr><td colspan=2><br>"+button(this.pref+'btn_sync_con',"","onClick=\""+this.ref+".fresync('contact')\"","Resynchroniser contacts")+"</td></tr>";
	a["content"]+="</table></div>";
	
	fnew_page(a,"right");
}

cgroup.prototype.fsetting_save=function(){
	var qry="update ncb_local_config set ag_aff='"+this.aff_select.v+"'," +
			"interval_ag='"+this.sync_ag_select.v+"'," +
			"interval_msg='"+this.sync_msg_select.v+"'," +
			"interval_con='"+this.sync_con_select.v+"' " +
			"where ncli="+this.n;
	odb.query(qry,this,this.fsuccess_setting_save_clb);
}

cgroup.prototype.fsuccess_setting_save_clb=function(myobj){
	myobj.fload_local_config();
	ftoast("Les paramètres sont enregistrés");
	fback_history('');
}

cgroup.prototype.fresync=function(_action){
	var tx="";
	if(_action=="agenda")tx="rendez-vous";
	else if(_action=="message")tx="messages";
	else if(_action=="contact")tx="contacts";
	fconfirm("Voulez-vous vraiment resynchroniser tous les "+tx+"? Les "+tx+" localement enregistrés seront effacés.",this.ref+".fresync2('"+_action+"')",null,140);
}
cgroup.prototype.fresync2=function(_action){
	if(!this["o"+_action]){
		this["o"+_action]=new window["c"+_action](this.ref+".o"+_action,this.pref+"_"+_action,this);
		this["o"+_action].fdisplay(this.hctn);
		this["o"+_action].fdisplay_header(this.hhdr);
		this["o"+_action].fhide();
	}
	this["o"+_action].fresync();
}

cgroup.prototype.fonline=function(){
	switch(this.action){
		case "agenda":
			if(!this.oagenda)return;
			fshow_loading();
			this.oagenda.fsync_agenda();
		break;
		case "message":
			if(!this.omessage)return;
			fshow_loading();
			this.omessage.fsync_message();
		break;
		case "contact":
			if(!this.ocontact)return;
			this.ocontact.fsync_contacts();
		break;
		case "nonlu":
			if(!this.ononlu)return;
			fshow_loading();
			this.ononlu.fremplir_nonlu();			
		break;
	}
}

