if(navigator.appName=="Netscape"){
    HTMLElement.prototype.__defineGetter__("children", function() {
          var arr = new Array(), i = 0, l = this.childNodes.length;
          for ( i = 0; i < l; i++ ) {
              if ( this.childNodes[ i ].nodeType == 1 ) {
                   arr.push( this.childNodes[ i ] );
              }
          }
     return arr;
     });

    HTMLElement.prototype.__defineGetter__("lastChild", function() {
	    var node = this.childNodes[ this.childNodes.length - 1 ];
	    while (node.nodeType != 1) node = node.previousSibling;
        return node;
    });

	// check for XPath implementation
	if( document.implementation.hasFeature("XPath", "3.0") )
	{
	   // prototying the XMLDocument
	   XMLDocument.prototype.selectNodes = function(cXPathString, xNode)
	   {
		  if(typeof(this.createNSResolver)=='function'){
			  if( !xNode ) { xNode = this; }
			  var oNSResolver = this.createNSResolver(this.documentElement)
			  var aItems = this.evaluate(cXPathString, xNode, oNSResolver,
					  		XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
			  var aResult = [];
			  for( var i = 0; i < aItems.snapshotLength; i++){
				 aResult[i] =  aItems.snapshotItem(i);
			  }
			  return aResult;
		  }else{
			  ftoast("Xml parser not supported");
		  }

	   }

	   // prototying the Element
	   Element.prototype.selectNodes = function(cXPathString)
	   {
		  if(this.ownerDocument.selectNodes)
		  {
			 return this.ownerDocument.selectNodes(cXPathString, this);
		  }
		  else{throw "For XML Elements Only";}
	   }

	   // prototying the XMLDocument
	   XMLDocument.prototype.selectSingleNode = function(cXPathString, xNode)
	   {
		   if(typeof(this.createNSResolver)=='function'){
			   if( !xNode ) { xNode = this; }
			  var oNSResolver = this.createNSResolver(this.documentElement)
			  var xItem = this.evaluate(cXPathString, xNode, oNSResolver,
						   XPathResult.FIRST_ORDERED_NODE_TYPE, null)
			  return xItem.singleNodeValue;
		  }else{
			 ftoast("Xml parser not supported");
		  }
	   }

	   // prototying the Element
	   Element.prototype.selectSingleNode = function(cXPathString)
	   {
		  if(this.ownerDocument.selectSingleNode)
		  {
			 return this.ownerDocument.selectSingleNode(cXPathString, this);
		  }
		  else{throw "For XML Elements Only";}
	   }
	}
}

function xmlattr2array(nd){
	var ar_res=new Array();
	var i=0;
	var ar_nd=nd.selectNodes("@*");

	for(i=0;i<ar_nd.length;i++){
		ar_res[ar_nd[i].nodeName]=ar_nd[i].nodeValue;
	}
	return ar_res;
}

function xmltag2array(nd,ar_res){
	if(!ar_res)var ar_res=new Array();
	if(!nd)return null;
	var ar_nd=nd.selectNodes("*");
	for(var i=0;i<ar_nd.length;i++){
	  var ndt=ar_nd[i].selectSingleNode("./text()");
	  if(ndt)ar_res[ar_nd[i].nodeName]=ndt.nodeValue;
	  else ar_res[ar_nd[i].nodeName]="";
	}
	return ar_res;
}

function xmltag2arraymask(nd,ar_res,mask){
	if(!ar_res)var ar_res=new Array();
	if(!nd)return null;
	for(var i=0;i<mask.length;i++){
    var ndt=nd.selectSingleNode(mask[i]+"/text()");
	  if(ndt)ar_res[mask[i]]=ndt.nodeValue;
	  else ar_res[mask[i]]="";
	}
	return ar_res;
}

function csoap(){}
csoap.prototype.has_network=function(){
	var networkState = navigator.connection.type;
    var states = {};
    states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.CELL]     = 'Cell generic connection';
    states[Connection.NONE]     = 'No network connection';
    if(networkState==Connection.NONE)return false;
    else return true;
}

csoap.prototype.call=function(req,fcallback,myobj,foffline){
	var hnwk=this.has_network();
	if(!hnwk){
		fcancel_loading();
    	if(foffline)foffline(myobj,req);
    	else ftoast("Vous n'êtes pas connecté à Internet.");
    	return;
    }
	
	req.sessionname='appmobile';
	req.version_app=version_app;
	req.version_app_str=version_app_str;
	req.platform='ios';

	$.ajax({
	    type       : "POST",
	    url        : soapurl+"pages/soap.php",
	    xhrFields  : {withCredentials: true},
	    crossDomain: true,
	    beforeSend : function() {},
	    complete   : function() {},
		timeout	   : 12000,
	    data       : req,
	    dataType   : 'xml',
	    success    : function(rt){
	    	if(debug)console.log(xmlToString(rt));
	    	var fs=rt.selectSingleNode("racine/callback/text()");
	    	if(fs && fs.nodeValue=='ffinsession'){
	    		var req_login={
	    				ismobile:1,
	    				soapmethod:'user',
	    				act:'login',
	    				ncb_ident:user.ncb_ident,
	    				ncb_mdp:user.ncb_mdp
	    		}

	    		soap.call(req_login);
	    		return;
	    	}
	    	var r=rt.selectSingleNode("racine/Result");
	    	if(fcallback)fcallback(r,rt,myobj,req);
	    },
	    error     : function() {
	    	fcancel_loading();
	    	if(foffline)foffline(myobj,req);
	    	else ftoast("La requête a échoué (timeout)");
	    }
	});
}

var soap=new csoap();