function telnum(_ref,_pref,_oparent, ocontact) {
	
	this.ref=_ref;
	this.pref=_pref;
	this.oparent=_oparent;
	
	this.ncli=this.oparent.n;
	this.nsoc=this.oparent.nsoc;
	this.nsoc0=this.oparent.nsoc0;
	
	this.aContactsTel = new Array();
	
	this.last_sync=this.oparent.local_config.con_last_sync;
	
	this.from=0;
	
	this.initial=1;
	
	this.ccontact = ocontact;
}


// Appel soap
telnum.prototype.fsync_telnums=function(){
	
	fshow_loading();

	console.log("!=============fsync_telnums");
	var req={
	soapmethod:'telnum',
	act:'mobile_sync',
	nco:this.ncli,
	nsoc:this.nsoc,
	nsoc0:this.nsoc0,
	from:this.from,
	initial:this.initial,
	last_sync:this.last_sync
	}
	
	if(this.fsync_timer)clearTimeout(this.fsync_timer);
	soap.call(req,this.fsync_telnum_clb,this);
	
}

// Callback appel soap
telnum.prototype.fsync_telnum_clb=function(r,rt,myobj){

	if (!r) return false;
	
	var xContactTel = r.selectNodes("./rows/row");
	var qry=new Array();
	
	// Suppression des données dans ncb_sys_contacts_tel
	qry.push("delete from ncb_sys_contacts_tel where nco in ( SELECT n FROM ncb_sys_contacts WHERE n_sys_contact_pere="+myobj.ncli+")");
	
	// Réinsertion
	for (var i = 0; i < xContactTel.length; i++) {
		
		var aContactTel = xmltag2array(xContactTel[i]);
		
		qry.push(insert_qry("ncb_sys_contacts_tel",aContactTel,true));
	}
	
	odb.query(qry,myobj);
	
	setTimeout("fcancel_loading()",2000);
	
	//myobj.ccontact.fget_contacts_tel();
}

