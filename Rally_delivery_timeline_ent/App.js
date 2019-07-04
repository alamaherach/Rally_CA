/**
 * @author: Adil Lamaherach
 * @about: Delivery timeline a visualazation of organizational roadmap 
 * 
 * TODO: Setup 
*/ 
Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
     items: [ {  // container for all the  menus \Bttons 
                 xtype: 'container',
                  itemId:'myContainer-id',
                  layout: {
                    type: 'hbox',
                    align: 'stretch'
                  },
                  width:'100%',
                  border: 15,
              },
    ],
    
    
   
   launch: function() {
       
        this.setLoading('Processing - Please wait ...');
        this.start_time = new Date().getTime(); // measure program performance  
         
        //API Docs: https://help.rallydev.com/apps/2.1/doc/
        this._detectClientBrowser(); 
        
        this._init();                       // Initialize and configure Report 
        this._loadTagChooser();             // add tag selector to filter result 
                                            // on change selection the program will run re-load and start again from ._loadPortfolioData();
        this._loadPortfolioData();          //Load all portfolio  objects and reset few variables
                                            // daizychain invoke core execution _Start()
    },
                                  
// *********************************************** Initialize and configure Report   *************************************   
  // Browser Detection
  _detectClientBrowser:function(){
        var app = this; 
         
         // Opera 8.0+
            //  app.isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        
        // Firefox 1.0+
         app.isFirefox = typeof InstallTrigger !== 'undefined';
        
        // Safari 3.0+ "[object HTMLElementConstructor]" 
           //  app.isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
        
        // Internet Explorer 6-11
         app.isIE = /*@cc_on!@*/false || !!document.documentMode;
        
        // Edge 20+
          app.isEdge = !app.isIE && !!window.StyleMedia;
        
        // Chrome 1+
         app.isChrome = !!window.chrome && !!window.chrome.webstore;
        
        // Blink engine detection
         app.isBlink = (app.isChrome || app.isOpera) && !!window.CSS;  
         
         var output = 'Detecting browsers by ducktyping:<hr>';
             output += 'isFirefox: '   + app.isFirefox  + '\n';
             output += 'isChrome: '    + app.isChrome   + '\n';
             output += 'isSafari: '    + app.isSafari   + '\n';
             output += 'isOpera: '     + app.isOpera    + '\n';
             output += 'isIE: '        + app.isIE       + '\n';
             output += 'isEdge: '      + app.isEdge     + '\n';
             output += 'isBlink: '     + app.isBlink    + '\n';
         console.log(output);
  },
  
   /** 
    * Set up Report  and Configuration 
    *      Set up global variables  
   */
  _init:function(){
        
        this.mbi_data_table = [];//Reort data tab;e
        //Report Legend 
        this.legend = {'No Entry'         :'<font color="#ff80aa">       &#9679;&nbsp;  </font>',   //pink
                       'Intake'           :'<font color="Black">        &#9679;&nbsp;  </font>', 
                       'Discovering'      : '<font color="Orange">      &#9679;&nbsp;  </font>',
                       'Delivering'       : '<font color="Blue">        &#9679;&nbsp;  </font>', 
                       'Value Realization': '<font color="#6600cc">     &#x2714;&nbsp;  </font>',  //purple
                       'Done'             : '<font color="darkgreen">   &#x2714;&nbsp;  </font>',

                    //   'Change in Delivery Date': 'brown',
                    //   'On Time': 'Black',
                    //   'Need Planned End Date': 'DarkGray',                  
                      };  
        
        // Report Metrics.         
        this.report_metrics =  {'No Entry'               : 0,
                                'Intake'                 : 0,
                                'Discovering'            : 0,
                                'Delivering'             : 0,
                                'Value Realization'      : 0,
                                'Done'                   : 0,
                  
                                // 'Change in Delivery Date': 0,
                                // 'On Time'                : 0,
                                // 'Need Actual End Date'   : 0,
                                // 'Need Planned End Date'  : 0,
                               };  
        this.scope = this.getContext().getProject().Name;  //  Scope (org or team level) "ex: Individual Investors"
        
        //Months of the year
        this.months = ['January','February','March','April','May','June','July','August','September','October','November','December'];   
        
        // set report start and end date 
        this.this_date = new Date();   // Today's date 
        // this.this_date = new Date('2018-1-20');  // test date        
        this.nbr_of_look_back_months  = 3; // how many months in the past the report need to go (should be less than 11)
        this._setTimeline(this.this_date , this.nbr_of_look_back_months);  // set report start and end date 
       
        //Report Columns Headers
        // this.report_columns_headers =['Program','Program_tool_tip','BI','BI_tool_tip'];  // report Columns Headers 
        this.report_columns_headers =[];  // report Columns Headers 
        this._addTargetDatesToColumnHeader();           // add date columns to report Columns Headers 
        this.report_columns_headers_size={};            //column header size properties
        this._initializeColumnsHeadersProperties();     // Set up column property | Column Sizing
           
        
        
        

       /**************  Print Configuration  ***************/ 
        console.log(" >>>>>>>>INIT>>>>>>>>>> " );
        console.log("Delivery Tiemline Configuration");
        
        console.log("Today is",this.this_date);                     
        console.log ("How far in the past the report need to go in months ",this.nbr_of_look_back_months);
        console.log ("Report start date  ",this.report_start_date);        
        console.log ("Report end date  ",this.report_end_date);  
        
        console.log("Report legend ", this.legend);
        console.log("Report metrics",this.report_metrics);
        console.log("Report scope: ", this.scope);
        console.log("report_columns_headers",this.report_columns_headers);
        console.log('report_columns_headers_size', this.report_columns_headers_size);
 
        console.log(" >>>>>>>>INIT>>>>>>>>>> " );           
  },
   /** 
    * Set up report timeline , Start date (report_start_date) and End Date (report_end_date) 
    * Input: today:        today's date 
    *        look_back:    how far in the past the report need to go
    *       
   */
  _setTimeline: function (today, look_back){
      var app = this;

      var this_month = today.getMonth();
      var this_year = today.getFullYear(); 

      var last_month = this_month; 
  
      // Setting Report Start date 
      if (this_month <= look_back){ // lookback from past year 
          app.report_start_date = new Date(this_year - 1 , 12 + this_month - look_back  ,1); 
      }else{ // start at the begining of current year
          app.report_start_date = new Date(this_year,0,1); 
      }

      // Setting Report End date 
      
      if(this_month === 11){ //
          last_month = 12+6;
      }else if( (this_month >= 8) && (this_month<=10)){
          last_month = 12+3;
      }else{
         last_month = 12; 
      }
      app.report_end_date = new Date(this_year, last_month,0);
  },     
  
// *********************************************** Build Report Column Headers  *************************************
  /**
   * Build Date range based Column header in report_columns_headers 
   */ 
  _addTargetDatesToColumnHeader: function (){
      var app = this;
      
      var year = app.report_start_date.getFullYear();     // report start year
      var start_index = app.report_start_date.getMonth(); // report start month index 
      
      var end_index = app.report_end_date.getMonth();     // report end month index 
      if(year < app.report_end_date.getFullYear()){      // adjust report if timeline is across two years 
         end_index = end_index  + 12;
      }      
      
     for(var next_month = start_index; next_month <= end_index ; next_month++ ){
             var column_header_name = app._buildColumnName(next_month, year);
             app.report_columns_headers.push(column_header_name); 
             app.report_columns_headers.push(column_header_name + '_tool_tip' ); 
         }
   },
  
  /** given a month index and a year, retun report column header */
  _buildColumnName: function(month_index, year){
      var app = this;
      var date = new Date(year, month_index + 1 ,0);
      return app._buildColumnNameFromDate(date);
  },   
 
  /** given a full date, retun column header */
  _buildColumnNameFromDate: function(date){
    //   console.log("date ", date);
      var app = this; 
      if ( (date < app.report_start_date) || (date > app.report_end_date) ){
          return -1 ;
      }
      var year = date.getFullYear();
      var index = date.getMonth();

      return app.months[index]+': '+ year;    
  },   
  
  // Set up column metadata for the grid display | Column Sizing
  _initializeColumnsHeadersProperties: function(){
        var app = this; 
        for (var i = 0; i < app.report_columns_headers.length; i++){
            // console.log(app.report_columns_headers[i]);
             var key = app.report_columns_headers[i];
             app.report_columns_headers_size[key] = 10;
       }
    },  

// *********************************************** Load Portfolio Items Data  *************************************
   /**
    * Load all portfolio  objects 
    * reset portfolio objects and report mertics and other varibles for reload 
    */
  _loadPortfolioData: function(){
       var app = this;
       
       app.object_count = 0;              // count porfolio object loaded so program cant start core process untill all object data are laoded and ready 
       
       //Reset report metrics
       for (var k in app.report_metrics ){
              if (app.report_metrics.hasOwnProperty(k)) {
                     app.report_metrics[k] = 0 ;
              }
        }  
        app.mbi_data_table =[];                // reset report
        app.start_time = new Date().getTime(); // reset measure program performance  of reload

        app.mbi             =[];          //contain all MBI portfolio objects that have parent BI                                 
        app._loadMBI();                   // Load MBI with parent BI 
        
        app.mbi_orphan      = [];         //contain all orphan MBI portfolio objects          
        app._loadMBIOrphan();             // Load orphan MBI 
        
        app.bi              =[];          //contain all BI portfolio objects
        app._loadBI();                    // Load BI 
   }, 

  _buildMBIFilters: function(){
       var app = this;

         var myFilter;
         

        // Date Filter  
        var end_date = ''.concat(app.report_end_date.getFullYear(), '-' , app.report_end_date.getMonth() + 1, '-' , app.report_end_date.getDate() );
          // End date
        var mbi_filter1 = Rally.data.wsapi.Filter.fromQueryString('(PlannedEndDate <= "'.concat(end_date ,'")') ); 
        var mbi_filter2 = Rally.data.wsapi.Filter.fromQueryString('(ActualEndDate  <= "'.concat(end_date ,'")')  ); 
        // myFilter = myFilter.and(mbi_filter3.or(mbi_filter4)); 
        myFilter = mbi_filter1.or(mbi_filter2); 
        
        //start date 
        var start_date = ''.concat(app.report_start_date.getFullYear(), '-' , app.report_start_date.getMonth() + 1, '-' , app.report_start_date.getDate() );
        var mbi_filter3 = Rally.data.wsapi.Filter.fromQueryString('(PlannedEndDate >= "'.concat(start_date ,'")') ); 
        var mbi_filter4 = Rally.data.wsapi.Filter.fromQueryString('(ActualEndDate  >= "'.concat(start_date ,'")')  ); 
        myFilter = myFilter.and(mbi_filter3.or(mbi_filter4)); 
        
        
        /*
        console.log("MBI start_date ", start_date);  
        console.log("MBI end_date ", end_date);   
        console.log("MBI mbi_filter3", '(PlannedEndDate <= "'+ end_date +'")' );   
        console.log("MBI mbi_filter4", '(ActualEndDate  <= "'+ end_date +'")' );  
        console.log("MBI mbi_filter5", '(PlannedEndDate >= "'+ start_date +'")' );   
        console.log("MBI mbi_filter6", '(ActualEndDate  >= "'+ start_date +'")' ); 
        */
        
        
        
        // Tag Filer:  example  ((Tags.Name = "Strategic") OR (Tags.Name = "RUB"))
        if ((typeof app.selected_tags !== "undefined") && (app.selected_tags.length > 0) ) { // Tag has not been selected yet . skip filter 
             var mbi_filter15 = Rally.data.wsapi.Filter.fromQueryString('(Tags.Name  = "'+ app.selected_tags[0] +'")'); 
             for(var i = 1 ; i < app.selected_tags.length ; i++){
                 mbi_filter15 =  mbi_filter15.or(Rally.data.wsapi.Filter.fromQueryString('(Tags.Name  = "'+ app.selected_tags[i] +'")')); 
             } 
            //  console.log("tag filters",app.selected_tags, "query", (mbi_filter15).and(myFilter));
             myFilter = myFilter.and(mbi_filter15);
        }       
        
        // State Filter   app.selected_state
        // if ((typeof app.selected_state !== "undefined") && (app.selected_tags.length > 0) ) { // Tag has not been selected yet . skip filter 
        //      var mbi_filter15 = Rally.data.wsapi.Filter.fromQueryString('(Tags.Name  = "'+ app.selected_tags[0] +'")'); 
        //      for(var i = 1 ; i < app.selected_tags.length ; i++){
        //          mbi_filter15 =  mbi_filter15.or(Rally.data.wsapi.Filter.fromQueryString('(Tags.Name  = "'+ app.selected_tags[i] +'")')); 
        //      } 
        //     //  console.log("tag filters",app.selected_tags, "query", (mbi_filter15).and(myFilter));
        //      myFilter = myFilter.and(mbi_filter15);
        // }       
        
        // // Filter by Scope
        //  var mbi_filter6 =  Rally.data.wsapi.Filter.fromQueryString('(Project.Name  = "'+ app.scope   +'")'); 
        //  myFilter = mbi_filter6; 
        
      //test
        // var mbi_filter100 =  Rally.data.wsapi.Filter.fromQueryString('(FormattedID = "M3265")');
        //   myFilter = myFilter.and(mbi_filter100);
        
        // var mbi_filter101 =  Rally.data.wsapi.Filter.fromQueryString('(FormattedID = "M3137")');  
        //   myFilter = myFilter.or(mbi_filter101);
          
        // var mbi_filter102 =  Rally.data.wsapi.Filter.fromQueryString('(FormattedID = "M2894")'); 
         //   myFilter = myFilter.or(mbi_filter102);
         
        // var mbi_filter103 =  Rally.data.wsapi.Filter.fromQueryString('(FormattedID = "M1239")');  
         //   myFilter = myFilter.or(mbi_filter103);
         
        // var mbi_filter104 =  Rally.data.wsapi.Filter.fromQueryString('(FormattedID = "M1181")');  
         //   myFilter = myFilter.or(mbi_filter104);
            
        return myFilter;
  },                                   
   /** 
   * Load All MBIs with parent
   * its important to ssort MBI by parent BI for easy batch processing of sibling MBIs
   */
  _loadMBI:function (){ 
       var app = this;
       var myFilter = app._buildMBIFilters();
       
       /*
        (
           (   (PlannedEndDate <= "2018-12-31")  OR  (ActualEndDate  <= "2018-12-31")    )  AND
           (  (PlannedEndDate  >= "2018-1-1")      OR  (ActualEndDate  >= "2018-1-1")         )
        )
        */
            Ext.create('Rally.data.wsapi.Store', {
            model: 'portfolioitem/MBI',
            filters: myFilter,            
            autoLoad: true,
            limit: Infinity,
            sorters: [
                        { property: 'Parent.FormattedID', direction: 'DESC'   }, // this cause MBI without parent to be excluded from result 
                        { property: 'ActualEndDate',  direction: 'DESC'   }, 
                        { property: 'PlannedEndDate', direction: 'DESC'   }, 
                     ],             
            listeners: { 
                 load: function(store, data) {
                        app.object_count++;
                        app.mbi = data;    
                        app._start('MBIs with parent');
                },
                scope: app
            },
             fetch: ['Project','FormattedID','Parent', 'Name', 'Milestones','State','PlannedEndDate','PlannedStartDate','ActualEndDate','ActualStartDate','Tags','LeafStoryCount','AcceptedLeafStoryCount','AcceptedLeafStoryPlanEstimateTotal','LeafStoryPlanEstimateTotal','DirectChildrenCount','WSJFScore', 'PreliminaryEstimateValue','Owner','UnEstimatedLeafStoryCount','Children']
        });  
    },  
   /** 
   * Load orpahn MBI | MBIs Without parent, 
   */    
  _loadMBIOrphan:function(){  // this will exclude  MBIs with parent
     var app = this; 
     var myFilter = app._buildMBIFilters();
     
     var mbi_filter1 = Rally.data.wsapi.Filter.fromQueryString('(Parent = null)' ); 
    
     myFilter = myFilter.and(mbi_filter1);
    //  console.log("myFilter" , myFilter) ;
    
         Ext.create('Rally.data.wsapi.Store', {
            model: 'portfolioitem/MBI',
            filters: myFilter,            
            autoLoad: true,
            limit: Infinity,
            sorters: [
                        { property: 'ActualEndDate', direction: 'DESC'   },  
                        { property: 'PlannedEndDate', direction: 'DESC'   }, 
                     ],             
            listeners: { 
                 load: function(store, data) {
                       app.object_count++;
                       app.mbi_orphan = data;
                       app._start('MBI _ orphan');
                },
                scope: app
            },
            // fetch: ['Parent','FormattedID', 'Name','State','PlannedEndDate','PlannedStartDate','ActualEndDate','ActualStartDate','Predecessors','Successors']
             fetch: ['Project','FormattedID','Parent', 'Name', 'Milestones','State','PlannedEndDate','PlannedStartDate','ActualEndDate','ActualStartDate','Tags','LeafStoryCount','AcceptedLeafStoryCount','AcceptedLeafStoryPlanEstimateTotal','LeafStoryPlanEstimateTotal','DirectChildrenCount','WSJFScore', 'PreliminaryEstimateValue','Owner','UnEstimatedLeafStoryCount','Children']
        });      
     
  },    
   /** 
   * Load All BI 
   */
  _loadBI:function (){
        var app = this;
        
        var bi_filter = Rally.data.wsapi.Filter.fromQueryString('(DirectChildrenCount > 0 )'); 
        /*
         (DirectChildrenCount > 0 )
        */
         Ext.create('Rally.data.wsapi.Store', {
            model: 'portfolioitem/BI',            
            autoLoad: true,
            filters: bi_filter,               
            limit: Infinity,
            sorters: [
                        { property: 'FormattedID', direction: 'DESC'   }, // this cause BI without parent to be excluded from result, but i need the sort
                     ], 
            listeners: { 
                load: function(store, data) {      
                    app.object_count++;    
                    app.bi = data; 
                    app._start('BIs ');
                },
                scope: app
            },
            // fetch: ['FormattedID', 'Name', 'Milestones','State','PlannedEndDate','PlannedStartDate','ActualEndDate','ActualStartDate']
            fetch: ['Project','FormattedID','Parent', 'Name', 'Milestones','State','PlannedEndDate','PlannedStartDate','ActualEndDate','ActualStartDate','Tags','LeafStoryCount','AcceptedLeafStoryCount','AcceptedLeafStoryPlanEstimateTotal','LeafStoryPlanEstimateTotal','DirectChildrenCount','WSJFScore', 'PreliminaryEstimateValue','Owner','UnEstimatedLeafStoryCount','Children']
        });  
    }, 

// *********************************************** Core Execution : Process Portfolio Items and build tata table repot *************************************                                   
 /**
 * Take mbi and retrun detail about it parent bi 
 */
  _get_bi_details:function(mbi_object){
        var app = this; 
      // Build Detail about MBI's parent BI. 
      
      var bi_detail ={ 
                       object                   : "N/A",
                       name                     : "N/A",
                       id                       : "N/A",
                       hyperlink_header         : "N/A",
                       metadata                 : "N/A",
                       DirectChildrenCount      : "N/A",
                     }; 
                     
        if (mbi_object && (mbi_object.Parent !== null)) { // have parent BI, otherwise this is an orphan MBI 
           var bi_object = mbi_object.Parent;
           bi_detail.object                   = bi_object; 
           bi_detail.name                     = bi_object.Name; 
           bi_detail.id                       = bi_object.FormattedID;
           bi_detail.hyperlink_header         = app._buildHyperlinkHeader(bi_object);
           bi_detail.metadata                 = app._buildMyMetaData(bi_object);
           bi_detail.DirectChildrenCount      = bi_object.DirectChildrenCount;
      }       
      return bi_detail; 
  }, 
  /**
 * Take mbi and retrun detail about it grandparent Program 
 */
  _get_program_details: function (mbi_object, bi_id){
      var app     = this; 
      var program_detail ={ 
              object              : "N/A",
              name                : "N/A",
              id                  : "N/A",
              hyperlink_header    : "N/A",
              metadata            : "N/A",
              DirectChildrenCount : "N/A",        
      };

      if (mbi_object && (mbi_object.Parent !== null)){//make sure that MBI has parent bi,  otherwise there is no grandparent program 
          var bi_index = binarySearch(app.bi, "FormattedID", bi_id);  // find bi object index in app.bi 
          if((bi_index !== -1) && ( app.bi[bi_index].raw.Parent !== null)){  //get grandparent "Program" details if one exist
              var program_object = app.bi[bi_index].raw.Parent;
              program_detail.object              = program_object; 
              program_detail.name                = program_object.Name; 
              program_detail.id                  = program_object.FormattedID; 
              program_detail.hyperlink_header    = app._buildHyperlinkHeader(program_object);
              program_detail.metadata            = app._buildMyMetaData(program_object); 
              program_detail.DirectChildrenCount = program_object.DirectChildrenCount; 
          } else{
                  app.orphan_bi_count ++;     // count orpahn BIs  
          }
      }    
      return program_detail;
  },
 /**
 * Take mbi and retrun core detail about it 
 */
  _get_mbi_details: function(mbi_object, mbi_index , batch_index){
      var app =this; 
      var mbi_detail = {
                           object                        : 'N/A',
                           Name                          : 'N/A',
                           id                            : 'N/A',
                           hyperlink_header              : 'N/A',
                           metadata                      : 'N/A',
                           State                         : 'N/A',
                           completion_date               : 'N/A',
                           DirectChildrenCount           : 'N/A',
                           completion_date_source        : 'N/A',  
                           mbi_column_header             : 'N/A',
                           mbi_tool_tip_column_header    : 'N/A',
                           //auditing / debuging 
                           batch_index                   : batch_index,
                           mbi_index                     : mbi_index,
                          };
      
      // Copy mbi object
      mbi_detail.object              =  mbi_object; 
      
      // State
      if ( ( mbi_object.State !== null)    ) { // check if MBI scheduled state is defined
            mbi_detail.State =  mbi_object.State.Name;
      } else{
           mbi_detail.State = 'No Entry';
      }  
    //   console.log("mbi_detail.State",mbi_detail.State);
      
      
      mbi_detail.Name                =  mbi_object.Name;
      mbi_detail.id                  =  mbi_object.FormattedID; 
      //Add Anotation Legend based on State
     //   console.log("app.legend[mbi_detail.State]",app.legend[mbi_detail.State]);
      mbi_detail.hyperlink_header    =  app.legend[mbi_detail.State] +  app._buildHyperlinkHeader(mbi_object) ; 
      mbi_detail.metadata            =  app._buildMyMetaData(mbi_object); 
      mbi_detail.DirectChildrenCount =  mbi_object.DirectChildrenCount;
      
      
      // target date

      if(mbi_object.ActualEndDate){ // use actual end date if available
          mbi_detail.completion_date    = convertCADateZ(mbi_object.ActualEndDate); 
          mbi_detail.completion_date_source = 'ActualEndDate'; 
              
      }else{  // use plan  end date if actual is not available
           mbi_detail.completion_date    = convertCADateZ(mbi_object.PlannedEndDate); 
           mbi_detail.completion_date_source = 'PlannedEndDate'; 
      } 
      //Report Column Header
      mbi_detail.mbi_column_header            = app._buildColumnNameFromDate(mbi_detail.completion_date);  
      mbi_detail.mbi_tool_tip_column_header   = mbi_detail.mbi_column_header + '_tool_tip';
    
    return mbi_detail; 
  },
  
  _build_mbi_data_table_record: function(mbi_details, bi_details, program_details){
      var app = this;
      var mbi_data_table_record = [];
      
     for ( var x = 0 ; x < app.report_columns_headers.length; x++ ){
                mbi_data_table_record[app.report_columns_headers[x]] ='';
             }      
             //update MBI record (column coordinate)
             //update with this MBI 
             mbi_data_table_record.Program                                   = program_details.hyperlink_header;
             mbi_data_table_record.Program_tool_tip                          = program_details.metadata;
             mbi_data_table_record['Business Increment']                     = bi_details.hyperlink_header;
             mbi_data_table_record['Business Increment_tool_tip' ]           = bi_details.metadata;
             mbi_data_table_record[mbi_details.mbi_column_header]            = mbi_details.hyperlink_header;
             mbi_data_table_record[mbi_details.mbi_tool_tip_column_header]   = mbi_details.metadata ; 
             return mbi_data_table_record; 
  },
  /**
   * Take a processed mbi and update summary metrics
   */ 
  _update_metrics_count: function(mbi_details){
      var app = this;
      app.report_metrics[mbi_details.State]++ ;
  }, 

  /**
   * try to group MBI records with simialr parents into fewer records 
   */ 
  _insertRecordtoBatch: function(batch, record, mbi_details){
      var inserted = false;
      // try to consalidate records befor insering new one 
          for(var i = 0; (i < batch.length)  && (!inserted) ; i++){
             if(batch[i][mbi_details.mbi_column_header].length === 0  ){// consalidate, there is room to do so
                // console.log("Consalidate Insert to batch " , mbi_details.id );
                batch[i][mbi_details.mbi_column_header]          = mbi_details.hyperlink_header;
                batch[i][mbi_details.mbi_tool_tip_column_header] = mbi_details.metadata;
                inserted = true; 
             }
          }
      
     // if this is a new bacth or there is no room in existing reocrds to conslaidate, insert a new record to the batch       
      if(!inserted){ 
          batch.push(record);
        //   console.log("New Record insert to batch ", mbi_details.id  );
      }
      return batch; 
  },
  /**
   * Take batch of record in insert them to data table one record at a time
   */ 
  _addMbisBatchToDataTableReport: function (batch){
       var app = this;
       for(var i = 0; i < batch.length; i++){
           app.mbi_data_table.push(batch[i]); 
       }
      
  },
  
  
  _start:function(from){
      var app = this; 
     app.setLoading(false); 
      console.log('done loading:', from);
      if(app.object_count !== 3){ // Protfolio data still loding 
            app.setLoading('done loading '+ from +' Please wait ...' ); // message user 
            return;
        } 
        var mbi_total = app.mbi.length + app.mbi_orphan.length; 
        app.setLoading('Processing ' +  mbi_total+ ' MBIs. Please wait ...');  // message user 
           
      /** All portfolio items */
      console.log('All BI '                 , app.bi);
      console.log('MBI with parent BIs '    , app.mbi);  
      console.log('Orphan MBIs '            , app.mbi_orphan);   

     //Process MBI  portfolio items. 
     var audit_batches  =[];  //Detail on common parent BI and Program             // Accounting / Auditing / Debug
     var mbis_in_batch  =[];
     var mbis_ignored   =[];
     var batch_size               = 0;  //size of each MBI batch processed        // Accounting / Auditing / Debug    
     var batch_index    = 0;  //Starting index for each batch            // Accounting / Auditing / Debug        
     var audit_mbis     =[];  // Detail on each MBI processed            // Accounting / Auditing / Debug
     
     var program_details;         // Program  info 
     var bi_details;              //  BI info 
     var mbi_details;             // processed BI info 
     var record         =[];                  // one MBI record
     var batch_recods   =[];           // group of MVIs with simila parent  
     var mbi_object;
     app.orphan_bi_count = 0 ;      // count of or orphan bis

     //      ********************     Process MBIs With Parent     ********************
     for(var i = 0; i< app.mbi.length; i++){
          
          mbi_object      = app.mbi[i].raw;  
          
          bi_details      =  app._get_bi_details(mbi_object);
          program_details =  app._get_program_details(mbi_object, bi_details.id);
                            // console.log(" 1 bi_details", bi_details);
                            // console.log(" 1 program_details", program_details);

          
          batch_size = 0; // reset batch size 
          mbis_in_batch = []; // reset
          batch_recods = [] ; // reset 
          
          //Process MBI and its sibling on the same batch (common ancestory: BI and Program)
          // the following while logic is repeated in the same function to process orpahn mbi
          // so any changes to this while loop logic here has to be repeated below 
          while ( (i < app.mbi.length) && (app.mbi[i].raw.Parent.FormattedID ===  bi_details.id) ){ // process batch of sibling MBIs ( MBIs with same parent BIs)
              mbi_object              = app.mbi[i].raw;  
            //   console.log(" 2 MBI batch with parent : processing i =  ", i, "  MBI Id:  " , app.mbi[i].raw.FormattedID);
              
              // Process MBI 
              mbi_details = app._get_mbi_details(mbi_object, i , batch_index);
              if (mbi_details.mbi_column_header !== -1){//  ignore MBI that is out of range based on actual planned date if exist, or planned end date 
                  
                   batch_size++;                           // Accounting / Auditing / Debug
                   mbis_in_batch.push(mbi_details.id);      // Accounting / Auditing / Debug
                   
                  //Update metrics count 
                  app._update_metrics_count(mbi_details);
                 
                  audit_mbis.push(mbi_details );   // Accounting / Auditing / Debug
                  
                  // Build Data Table Record 
                  record = app._build_mbi_data_table_record(mbi_details, bi_details, program_details);       
                    
                  // Build batch that combine as many records as possible to fewer records 
                  batch_recods = app._insertRecordtoBatch(batch_recods, record, mbi_details);
                //  console.log("3 just completed mbi ",mbi_details.id, mbi_details);
            }else{
                mbis_ignored.push(mbi_details.id);  // Accounting / Auditing / Debug
                
            }
             i++;
          }
          
        //   console.log('4 batch_recods  inserted to data table ', batch_recods);
           app._addMbisBatchToDataTableReport(batch_recods); // Basis for grid view 
          
          i--; // backup to adjust so that "for loop" continue at the next batch of MBI with the next common parent BI
          // Accounting / Auditing / Debug  
          audit_batches.push({           
                                  'BI Batch index'                 : batch_index,
                                  'BI id'                          : bi_details.id , 
                                  'BI'                             : bi_details,
                                  'batch_size'                     : batch_size ,
                                  'program id'                     : program_details.id,
                                  'program '                       : program_details,
                                  'mbis_in_batch'                  : mbis_in_batch,
                                 }); 
         batch_index++;
        
      } // Done processing MBI With Parent 
      
      
     //      ********************     Process Orphan MBIs     ********************
     batch_size = 0; // reset batch size 
     mbis_in_batch = []; // reset
     batch_recods   =[];   // reset batch
     i = 0; 
     bi_details      =  app._get_bi_details(false);                      // initialized with N/A's
     program_details =  app._get_program_details(false, ''); // initialized with N/A's
                //   console.log(" 9 bi_details", bi_details);
                //   console.log(" 9 program_details", program_details);
     //  Orphan MBIs 
     // the following while logic is simila to the above while logic in the same function to process  mbi with parent
     // so any changes to this while loop logic here has to be repeated above 
     while ( (i < app.mbi_orphan.length) ){ 
            // console.log(" 10 orphan : processing i =  ", i, "  orphan MBI Id:  " , app.mbi_orphan[i].raw.FormattedID);
            mbi_object              = app.mbi_orphan[i].raw; 
            
            // Process MBI 
            mbi_details = app._get_mbi_details(mbi_object, i , -1);
              // Process MBI 
            if (mbi_details.completion_date !== -1){//  ignore MBI that is out of range based on actual planned date if exist, or planned end date 
              
               batch_size++;            // Accounting / Auditing / Debug
                mbis_in_batch.push(mbi_details.id);      // Accounting / Auditing / Debug
          
              //Update metrics count 
              app._update_metrics_count(mbi_details);

              audit_mbis.push(mbi_details );   // Accounting / Auditing / Debug
              
              // Build Data Table Record 
              record = app._build_mbi_data_table_record(mbi_details, bi_details, program_details);       

              // Build batch that combine as many records as possible to fewer records 
              batch_recods = app._insertRecordtoBatch(batch_recods, record, mbi_details);
            //   console.log("11 just completed mbi ",mbi_details.id, mbi_details);
            }else{
                mbis_ignored.push(mbi_details.id); // Accounting / Auditing / Debug
            }

         i++;
      } // Done Processing Orphan MBIs
                
    app._addMbisBatchToDataTableReport(batch_recods); // Basis for grid view 
   
    audit_batches.push({ 'orphan_batch_size'             : batch_size,
                         'mbis_in_batch'                 : mbis_in_batch,    });
    app.orphan_mbi_count = batch_size; 
                           
     audit_batches.push({mbis_ignored : mbis_ignored});
                           
     console.log("audit_batches processed"  , audit_batches);
     console.log("audit_mbis processed"     , audit_mbis);
     console.log("MBI Data Table"           , app.mbi_data_table);
 
    //   app._buildGrid();       //Build and Dispaly Grid View 
      app._buildGridNew();       //Build and Dispaly Grid View 
    
         
      app.setLoading(false);  
        
      // measure program performance  
      var execution_time = (new Date().getTime() - app.start_time) / 1000;
      console.log("Program done execution in: ", execution_time ) ;
 
    },

  /**
   *  Take Portfolio Object
   *  Return its key statitisics metadata
   */ 
  _buildMyMetaData: function (Portfolio_object){
     // Build Meta data String 
     var metadata =''; 
     
     var linebreak = '<br>'; // "\n"; 
     // https://www.w3schools.com/charsets/ref_utf_dingbats.asp 
     // green checkmark &#9989;   // red exclamamtion mark &#10071  // red cross mark &#10060;
     var exclamation_mark  = '&#10071; ';
     
     var pct_done_header = " ------ % Done ------------ ";
     var missing_header  = " -------------------------- ";
     
     //Header 
     metadata = ''.concat('<b> <font color="#ccffff">',Portfolio_object.FormattedID,"</b> </font>: " , Portfolio_object.Name, linebreak );
     
     /* % Done */
    //  if(Portfolio_object.LeafStoryCount > 0 ){
         metadata = metadata.concat(pct_done_header,linebreak);
         var points_accpeted    = 0; 
         if(Portfolio_object.LeafStoryPlanEstimateTotal !== 0){
              points_accpeted   = ((Portfolio_object.AcceptedLeafStoryPlanEstimateTotal  / Portfolio_object.LeafStoryPlanEstimateTotal) * 100).toFixed(0); 
         }
         metadata = metadata.concat( points_accpeted,      "%  ", Portfolio_object.AcceptedLeafStoryPlanEstimateTotal ," of ", Portfolio_object.LeafStoryPlanEstimateTotal, " Points Accepted",      linebreak); 
         
         var userStories_accpeted = 0; 
         if(Portfolio_object.LeafStoryCount !== 0){
            userStories_accpeted     = ((Portfolio_object.AcceptedLeafStoryCount          / Portfolio_object.LeafStoryCount) * 100).toFixed(0); 
         }
         metadata = metadata.concat( userStories_accpeted, "%  ", Portfolio_object.AcceptedLeafStoryCount,            " of ",  Portfolio_object.LeafStoryCount,             " User Stories Accepted", linebreak); 
    //  }

     /* missing data */
       metadata = metadata.concat(missing_header,linebreak); 
       // unestimated stories 
        if(Portfolio_object.UnEstimatedLeafStoryCount > 0){
            metadata  = metadata.concat(exclamation_mark, "Missing Estimates: ", Portfolio_object.UnEstimatedLeafStoryCount, " User Stories",linebreak);
         }
      //missing planned end date 
     if(Portfolio_object.PlannedEndDate === null){
        metadata  = metadata.concat(exclamation_mark, 'Missing Planned End Date', linebreak) ;
     }
    return metadata;
  },
    /**
   *  Take Portfolio Object
   *  Return hyperlink header
   */ 
  _buildHyperlinkHeader: function(Portfolio_object){
      var id     =  Portfolio_object.FormattedID;
      var title  = Portfolio_object.Name;
      var url    = ''.concat('https://rally1.rallydev.com/#/search?keywords=', id); 
      // build and return hyperlink header 
      return ''.concat('<a href="' , url, '" target="_blank" >' ,  id , "</a>", ": ", title , "<br>");
  },
// *********************************************** Build and Dispaly Report Grid   *************************************  
  _buildGridNew: function(){
       var app = this;
       
         if( app.my_grid){ // if grid object does exit, get rid of it 
            // console.log("Destroy Grid ") ;
            app.my_grid.destroy();
            // app.destroy(app.exportBtn);
            // app.destroy(app.printtBtn);
        }       
       
       //Report Column Headers  >>  removing all tooltip columns from display  
       var report_column_header = ['Program','Business Increment'];
       for (var i = 0; i < app.report_columns_headers.length;i++){
          // if(!app.report_columns_headers[i].includes("tool_tip")){ // this is not supported in I.E
          if(app.report_columns_headers[i].indexOf("tool_tip") === -1){ // remove tool_tip column from report
               report_column_header.push(app.report_columns_headers[i]);
           }
       }
       console.log("report_column_header",report_column_header);
       
       //Report Column Headers definition
       var report_column_header_definition =[];
       for( i =  0; i< report_column_header.length; i++){
           report_column_header_definition.push({text      : report_column_header[i],
                                                 dataIndex :report_column_header[i],
                                                 width     :100,
                                               });
       }
    //   console.log("report_column_header_definition",report_column_header_definition);
      
       // Data table
       var data_table = app.mbi_data_table; 
       
                        //  [ 
                        //   {Program:"Program 1", Program_tool_tip: "&#33;    P1_Meta", BI:"BI 1", BI_tool_tip: "BI_1_Meta", "05/2018":"MBI 1" , "05/2018_tool_tip":" MBI 1 _ meta" , "06/2018":"MBI 9"  , "06/2018_tool_tip":" MBI 9 _ meta"},
                        //  ];
       
       // Data table - STORE 
        app.ds = Ext.create('Ext.data.Store', {
        storeId:'dataTableStore',
        fields:report_column_header,
        data:data_table, 
        groupField: 'Program', //default Grouping if grouping feature is enable in the grid
        groupDir: 'ASC',
 
    });

   // Grid View

        app.my_grid = Ext.create('Ext.grid.Panel', { 
           id: "my_grid",
        title: 'MBI Delivery Timeline',
        // store: Ext.data.StoreManager.lookup('dataTableStore'),
        store: app.ds ,
        columns: report_column_header_definition,
                // [
                //   {text: 'Program'   ,  dataIndex:'Program'},
                //  ]
        columnLines: true,
        sortableColumns: true,
        height: 1100,    
        width: '100%',   
        maxHeight:'100%',
        tbar: [ { xtype: 'label', html: app._buildGridLegend() }],  // add report legend
        forceFit: true,
        renderTo: Ext.getBody(),
        
        //Grouping features
        features: [{
                    ftype: 'groupingsummary',
                    groupHeaderTpl: '{name} ({rows.length})', 
                }],
        });  

        /* Logic for default view to show  columns between current month - 1 and current month + 4  */
       var active_header = app._buildColumnNameFromDate(app.this_date);
       var index = searchKeyPair(app.my_grid.columns,'text' , active_header);
        // console.log('active_header ', active_header); 
       if(index !== -1){// only show default coulmn and auto hide eveything else 
            for (i = 2 ; i < app.my_grid.columns.length ; i++){ // don't hide Program and BI columns 
                if( (i < index -1) || (i > index + 4) ){
                    app.my_grid.columns[i].setVisible( false);
                }
            }
       }
        
    // add grid to container 
    app.add(app.my_grid); 
    
    // add tool tip 
    app._addToolTip(app.my_grid); 
    
    // 
    // if( !app.filter_by_state ){
    //  app._addFilterByState();
    // }
    
    // Add export function menu if not already added 
    if(app.isChrome || app.isFirefox  ) {// supported browsers 
        if(!app.exportBtn_added){
             app._addCSVExport_Btn(); 
        }
    }
   
    //add print function menu if not already added 
      if(app.isChrome || app.isFirefox  || app.isIE) {// supported browsers 
         if(!app.printtBtn_added){
          app._print();
        }
     }
    
  },

  _buildGridLegend: function(){
       var app = this; 
        // build legend string
        var delimiter = ' | '; 
        var legend_text = delimiter;
        var total = 0;
        
        for( var key in app.legend){
         if (app.legend.hasOwnProperty(key)) {
            //  console.log('key ', key, ' value ')
             total +=   app.report_metrics[key]; 
             legend_text = legend_text + app.legend[key] + ' ' + key + ": " + app.report_metrics[key] +  delimiter; 
           }
        }
        legend_text ='(<b>'+ total+' </b>)'+ legend_text; 
        
        //Orphan MBIs Count
         legend_text =  legend_text  + "<u> Orphan MBIs: "+  app.orphan_mbi_count + '</u>' +  delimiter;  
         //Orphan BI Count
         legend_text =  legend_text  + "<u> Orphan BIs: "+  app.orphan_bi_count  + '</u>'; 
         
        
     // Add selected tag list to Legend  
            if ((typeof app.selected_tags !== "undefined") && (app.selected_tags.length > 0) ) { 
                 legend_text += '<br><br> <i>Filtered by tag(s):</i>  ';
                 for(var  i =0; i < app.selected_tags.length; i++){
                     legend_text += '<font color="red"> ' + app.selected_tags[i] + '</font>' + delimiter; 
                 }
             }        
        
        
        // console.log("legend_text >>>", legend_text);
        return legend_text; 
   },
   
  _buildGridOld: function(){
       var app = this;
       
       var report_column_header =["Program","BI","05/2018","06/2018"];

       var data_table = [ 
                           {Program:"Program 1", Program_tool_tip: "&#33;    P1_Meta", BI:"BI 1", BI_tool_tip: "BI_1_Meta", "05/2018":"MBI 1" , "05/2018_tool_tip":" MBI 1 _ meta" , "06/2018":"MBI 9"  , "06/2018_tool_tip":" MBI 9 _ meta"},
                           {Program:"Program 1", Program_tool_tip: "&#10071; P1_Meta", BI:"BI 1", BI_tool_tip: "BI_1_Meta", "05/2018":"MBI 2" , "05/2018_tool_tip":" MBI 2 _ meta" , "06/2018":"MBI 10" , "06/2018_tool_tip":" MBI 10 _ meta"},
                           {Program:"Program 1", Program_tool_tip: "&#10060; P1_Meta", BI:"BI 1", BI_tool_tip: "BI_1_Meta", "05/2018":"MBI 3" , "05/2018_tool_tip":" MBI 3 _ meta" , "06/2018":"MBI 11" , "06/2018_tool_tip":" MBI 11 _ meta"},
                           {Program:"Program 1", Program_tool_tip: "&#9989;  P1_Meta", BI:"BI 2", BI_tool_tip: "BI_2_Meta", "05/2018":"MBI 4" , "05/2018_tool_tip":" MBI 4 _ meta" , "06/2018":"MBI 12" , "06/2018_tool_tip":" MBI 12 _ meta"},
                           {Program:"Program 1", Program_tool_tip: "P1_Meta", BI:"BI 2", BI_tool_tip: "BI_2_Meta", "05/2018":"MBI 5" , "05/2018_tool_tip":" MBI 5 _ meta" , "06/2018":"MBI 13" , "06/2018_tool_tip":" MBI 13 _ meta"},
                           {Program:"Program 1", Program_tool_tip: "P1_Meta", BI:"BI 2", BI_tool_tip: "BI_2_Meta", "05/2018":"MBI 6" , "05/2018_tool_tip":" MBI 6 _ meta" , "06/2018":"MBI 14" , "06/2018_tool_tip":" MBI 14 _ meta"},
                           {Program:"Program 1", Program_tool_tip: "P1_Meta", BI:"BI 3", BI_tool_tip: "BI_3_Meta", "05/2018":"MBI 7" , "05/2018_tool_tip":" MBI 7 _ meta" , "06/2018":"MBI 15" , "06/2018_tool_tip":" MBI 15 _ meta"},
                           {Program:"Program 1", Program_tool_tip: "P1_Meta", BI:"BI 3", BI_tool_tip: "BI_3_Meta", "05/2018":"MBI 8" , "05/2018_tool_tip":" MBI 8 _ meta" , "06/2018":"MBI 16" , "06/2018_tool_tip":" MBI 16 _ meta"},
                           {Program:"Program 2", Program_tool_tip: "P2_Meta", BI:"BI 4", BI_tool_tip: "BI_4_Meta", "05/2018":"MBI 33", "05/2018_tool_tip":" MBI 33 _ meta", "06/2018":"MBI 41" , "06/2018_tool_tip":" MBI 41 _ meta"},
                           {Program:"Program 2", Program_tool_tip: "P2_Meta", BI:"BI 4", BI_tool_tip: "BI_4_Meta", "05/2018":"MBI 34", "05/2018_tool_tip":" MBI 34 _ meta", "06/2018":"MBI 42" , "06/2018_tool_tip":" MBI 42 _ meta"},
                           {Program:"Program 2", Program_tool_tip: "P2_Meta", BI:"BI 4", BI_tool_tip: "BI_4_Meta", "05/2018":"MBI 35", "05/2018_tool_tip":" MBI 35 _ meta", "06/2018":"MBI 43" , "06/2018_tool_tip":" MBI 43 _ meta"},
                           {Program:"Program 2", Program_tool_tip: "P2_Meta", BI:"BI 5", BI_tool_tip: "BI_5_Meta", "05/2018":"MBI 36", "05/2018_tool_tip":" MBI 36 _ meta", "06/2018":"MBI 44" , "06/2018_tool_tip":" MBI 44 _ meta"},
                           {Program:"Program 2", Program_tool_tip: "P2_Meta", BI:"BI 5", BI_tool_tip: "BI_5_Meta", "05/2018":"MBI 37", "05/2018_tool_tip":" MBI 37 _ meta", "06/2018":"MBI 45" , "06/2018_tool_tip":" MBI 45 _ meta"},
                           {Program:"Program 2", Program_tool_tip: "P2_Meta", BI:"BI 5", BI_tool_tip: "BI_5_Meta", "05/2018":"MBI 38", "05/2018_tool_tip":" MBI 38 _ meta", "06/2018":"MBI 46" , "06/2018_tool_tip":" MBI 46 _ meta"},
                           {Program:"Program 2", Program_tool_tip: "P2_Meta", BI:"BI 6", BI_tool_tip: "BI_6_Meta", "05/2018":"MBI 39", "05/2018_tool_tip":" MBI 39 _ meta", "06/2018":"MBI 47" , "06/2018_tool_tip":" MBI 47 _ meta"},
                           {Program:"Program 2", Program_tool_tip: "P2_Meta", BI:"BI 6", BI_tool_tip: "BI_6_Meta", "05/2018":"MBI 40", "05/2018_tool_tip":" MBI 40 _ meta", "06/2018":"MBI 48" , "06/2018_tool_tip":" MBI 48 _ meta"},
                         ];
       
       // Data table - STORE 
        Ext.create('Ext.data.Store', {
        storeId:'dataTableStore',
        fields:['Program', 'BI', '05/2018', '06/2018'],
        data:data_table, 
         //default Grouping if grouping feature is enable in the grid
          groupField: 'Program', 
          groupDir: 'ASC',
 
    });

   // Grid View

        app.my_grid = Ext.create('Ext.grid.Panel', { 

        title: 'MBI Delivery Timeline',
        store: Ext.data.StoreManager.lookup('dataTableStore'),
        columns: [
                   {text: 'Program'   ,  dataIndex:'Program'},
                   {text: 'BI'        ,  dataIndex:'BI'     },
                   {text: '05/2018'   ,  dataIndex:'05/2018'},
                   {text: '06/2018'   ,  dataIndex:'06/2018'},
                 ],
                    //     {text: 'Last Name',  dataIndex:'lastname'},
                    //     {text: 'Hired Month',  dataIndex:'hired', xtype:'datecolumn', format:'M'},
                    //     {text: 'Department (Yrs)', xtype:'templatecolumn', tpl:'{dep} ({seniority})'}
      
        width: 400,
        forceFit: true,
        renderTo: Ext.getBody(),
        
        //Grouping features
        features: [{
                    ftype: 'groupingsummary',
                    groupHeaderTpl: '{name} ({rows.length})', 
                }],
        
        //enable tooltip to get cell position         
        // selType: 'cellmodel',      

    });  


        
    // add grid to container 
    app.add(app.my_grid); 
    // add tool tip 
    app._addToolTip(app.my_grid); 
    // Add export function 
    app._addCSVExport_Btn(report_column_header); 
    //add print function
    app._print();
  },
     /**  * Laod Tags menu  */
  _loadTagChooser : function (){
       var app = this;
       var tag_picker =  {
                          xtype: 'rallytagpicker',
                          itemId: 'tag-picker-id',
                          alwaysExpanded: false,
                          autoExpand: false, 
                          fieldLabel: 'Tags',
                          labelWidth: 100,
                          labelAlign: 'right',
                          width: 300,
                        //   margin: '0 50 0 10',
                          storeConfig: {
                                      sorters: [{
                                                    property: 'Name',
                                                    direction: 'ASC'
                                              }],
                                      filters: [{
                                                    property: 'Archived',
                                                    value: false
                                              }],
                                  },    
                                  listeners: {
                                                scope: app,
                                                selectionchange: app._getSelectedTagsValues
                                            },
      };
      // app.add(tag_picker);

      app.down('#myContainer-id').add(tag_picker); 

   },
     /** * get selected tag values and resun the program  */
  _getSelectedTagsValues: function (){
      var app= this; 
       var tag_objects = app.down('#tag-picker-id').getValue(); 
        // console.log("selected tag_objects", tag_objects) ;
        app.selected_tags = [];
        for(var i = 0 ; i < tag_objects.length; i++){
            //  console.log("selected tag_objects", tag_objects[i].data.Name) ;
             app.selected_tags.push(tag_objects[i].data.Name);
        }
        console.log("tags ", app.selected_tags) ;
        
        app._loadPortfolioData();   //reset and reload 
  } ,    
   //add ToolTip to Grid
   /**
    * Add tool tip to a given grid 
    */ 
  _addToolTip: function (grid) {
        // Grid ToolTip 
        var view = grid.getView();
        var tip = Ext.create('Ext.tip.ToolTip', {
        // The overall target element.
        target: view.el,
        
        // Each grid row causes its own separate show and hide.
        //delegate: view.itemSelector,
        delegate: view.cellSelector,
        
        // Moving within the row should not hide the tip.
        trackMouse: true,
        // Render immediately so that tip.body can be referenced prior to the first show.
        renderTo: Ext.getBody(),
        listeners: {
                    // Change content dynamically depending on which element triggered the show.
                    beforeshow: function updateTipBody(tip) {
                        var column        = view.getGridColumns()[tip.triggerElement.cellIndex]; //console.log("column" , column);
                        var record        = view.getRecord(tip.triggerElement.parentNode);       //console.log("record" , record);
                        var column_header = column.dataIndex;                                    //console.log("column header" , column_header);
                        // var row_index     = record.index;                                        //console.log("row index" , row_index);
                        //var tool_tip      = data_table[row_index][column_header +"_tool_tip"];   console.log("tool_tip" , tool_tip);
                        
                        column_header =  column_header +"_tool_tip";
        
                        var tool_tip      = record.raw[column_header];  
                        // console.log("tool_tip" , tool_tip);
        
                        //tip.update('' + record.get(column.dataIndex) + '<br> line 2');
                        tip.update(tool_tip);
                        }  
                    }
        });  
    },  
   //Build Export functionality 
   /**
    * Add Export button 
    */ 
   _addCSVExport_Btn: function(){
      var app=this; 
       // Add Export to CSV Button 
      var exportBtn =  Ext.create('Ext.Button', {
                        text: 'Export to CSV',
                        margin: '0 20 0 20',
                        renderTo: Ext.getBody(),
                        handler: function() {
                           app._exportToCSV();
                        }
                    });
          app.exportBtn_added =true;
          app.down('#myContainer-id').add(exportBtn);      
  },

   /**
   *  Input Grid View and Column Header
   *  Build and Downlowad CSV gile 
   * */
   _exportToCSV:function () {
       var app=this; 
        // console.log(" view", grid_View);
        // console.log(" report header", report_column_header);
        
        
         var grid_View = app.my_grid.getView();// .store.data.items; 
         var visible_columns = app.my_grid.headerCt.gridVisibleColumns;
        
        
        /* Convert grid_View Object to CSV "String" */ 
        var csv = "";
        var quote = "\"";
        var column_delimiter =  ',';
        var line_delimiter =  '\n';  // "\r"   // "\r\n"
        
        //Build Columns / Headers
        for (var i = 0; i < visible_columns.length; i++) {
                csv += visible_columns[i].text + column_delimiter;
        }
        // csv = csv.substring(0, csv.length-1);
        csv += line_delimiter;
        // console.log("text 1 CSV header: ",csv);
        
        
        //Build content / Rows
        var rows = grid_View.dataSource.data.items;
        // console.log("rows",rows);
        
        for ( i = 0; i < rows.length; i++) {
            var row = rows[i].data;
            for (var j = 0; j < visible_columns.length; j++) {
                    var value = app._escapeForCSV(row[ visible_columns[j].text ]);
                    value = app._stripHTMLelement(value); // Remove HTML ELement        **************** TO DO
                    csv += quote + value + quote + column_delimiter;
            }
            // csv = csv.substring(0, csv.length-1);
            csv += line_delimiter;
        }
        // console.log("text expportable CSV: ",csv);
        
         /* Download CSV file  */ 
        window.location = 'data:text/csv;charset=utf8,' + encodeURIComponent(csv);
    },
   /**
     * Clean a given string for CSV file to rebder correctly 
     */
   _escapeForCSV: function(string) {
        
        if (string.match(/,/)) {
            if (!string.match(/"/)) {
                string = '"' + string + '"';
            } else {
                string = string.replace(/,/g, ''); 
            }
        }
        return string;
    },    
   /**
     * Clean a given string for CSV file to rebder correctly 
     */
   _stripHTMLelement:function(string){
        // console.log("original String", string);
        
        var str = string.toString();
        // &#x2714; //  &nbsp;  //  &#9679;     
       
       str = str.replace(/<[^>]*>/g, '');            // Remove HTML Element 
       
       //remove leading spaces
        str = str.trim(); 

       //Romove HTML anotation  based on what is used in legend 
       var n = str.indexOf("&#x"); 
       var sub_str = '';
       if(n === 0 ){
          sub_str = str.substring(n, n+14);
          //   console.log('str', str, 'n' , n , 'sub_str',sub_str);
          str = str.replace(sub_str, "");    
       }
       
       n = str.indexOf("&#"); 
       if(n === 0 ){
          sub_str = str.substring(n, n+13);
        //   console.log('str', str, 'n' , n , 'sub_str',sub_str);
          str = str.replace(sub_str, "");    // TEst  remove 
       }
       
       //remove leading spaces
        str = str.trim();        
        // console.log("cleaned up String", str);
        return str;
   },
    //Build print functionality   
   /**
    * Add Print  button & Print functionality
    */ 
   _print: function(){
      var app=this; 
      
      // Add print button
      var printtBtn =  Ext.create('Ext.Button', {
                        text: 'Print',
                        // margin: '0 0 0 500',
                        renderTo: Ext.getBody(),
                        handler: function() {
                            app._printing();
                        }
                    });
     app.printtBtn_added = true;     
     app.down('#myContainer-id').add(printtBtn);
      
    },
    /**
     * Convert grid to HTML table before printing 
     */ 
   _printing:function(){
        var app = this; 

        
//   var myData = app.ds; 
      var myData = app.my_grid.getView().store.data.items; 
      var visible_columns = app.my_grid.headerCt.gridVisibleColumns;
      
      // var printwindow=window.open('', '', 'width=1000,height=500');
      var printwindow=window.open();
      var myDate = new Date();
      
    //   console.log(' columns ' , visible_columns);
    //   console.log("myData : app.my_grid.getView()", myData );
      
      // Build CSS 
      var css = '<style type="text/css">';
      css += 'div.div1 { background-color: #cce6ff; font-size: small;}';

      //CSS: print table header in each page
      css += '@media print { thead {display: table-header-group;}}'; 
      //CSS: Table
         //   Browser support
      if(!app.isIE){
            css +='table, th, td  {border-collapse:collapse; border: 1px solid lightgrey; font-style: normal; font-size: 15%;}'; 
         } else{
            css +='table, th, td  {border-collapse:collapse; border: 1px solid lightgrey; font-style: normal;}'; 
      }
       
      css += 'tr.d0 td { background-color: white; color: black;}';
      css += 'tr.d1 td { background-color: #f0f0f0; color: black;}';

      css += '</style>';


      var title = 'MBI Delivery Timeline: ' + app.scope; 
       //build HTML Page  
      var html_page =' <!DOCTYPE html> '; 
      html_page +='<body> '; 
      html_page +='<head> ';   
      html_page += '<title> Printable ' + title + '</title>';
      
      // Page Header 
      html_page +=  '<div id="todayDate">' + Ext.Date.format(myDate,'F j, Y, g:i a') + '</div>';    
        // org/team name
      html_page +=  '<div id="header"> ' + title +' </div> <br>';
        // legend | report summary 
      html_page +=  '<div id="legend"; class ="div1" >' + app._buildGridLegend() +' </div>';

      html_page += '</head>'; 



      html_page +='<table >' ;
      html_page +='<width="100%">';  
      html_page += ' <thead>';
      html_page += '<tr>';
      for (var k  = 0 ; k <  visible_columns.length; k++){
                    html_page +='<th>'+ visible_columns[k].text +'</th>';    
            }
      html_page += '</tr>  </thead>';

      //table raws
      for(var r= 0 ; r < myData.length; r++){   
          if((r % 2) === 0){
            html_page += '<tr class= "d0">';
          }else{
            html_page += '<tr class= "d1">';
          }
        
          for (k  = 0 ; k <  visible_columns.length; k++){
                html_page +='<td>'+ myData[r].data[visible_columns[k].text] +'</td>';    
          }
        html_page += '</tr>';
        }
        html_page += '</table>'; 
        

       html_page +='</body> ';           
       html_page +='</html> ';         

       
        
      //Page Header
        //   printwindow.document.write('<div id="todayDate">' + Ext.Date.format(myDate,'F j, Y, g:i a') + '</div>');            
        //   printwindow.document.write('<div id="header">Delivery Timeline: ' + app.scope +' </div> <br>');
        //   printwindow.document.write('<div id="legend"; class ="div1" >' + app._buildGridLegend() +' </div> ');      
          
        // Build the page 
        // Add css
        printwindow.document.write(css);          
        // add  printable html page 
        printwindow.document.write(html_page);
         
        printwindow.document.close();
        printwindow.focus();
        printwindow.print();
        printwindow.close();
    },
    
   _addFilterByState: function(){
      var app = this;        
      app.filter_by_state = true; 
       var state_combobox ={
           xtype:'rallyfieldvaluecombobox', 
           itemId:'state-picker-id',
           model: 'PortfolioItem/MBI',
           field: 'State',
           fieldLabel:'State',
           labelAlign:'right',
           width:300,
           multiSelect : false,
           listeners:{
               // fires when combobox default 'severity' is ready 
            //   ready: app._loadData, // fires when combobox is ready , attaching method to this event
            //   select:app._loadData, // fires when user make iteration selection , attaching method to this event
               scope: app,
               select: app._getSelectedStateValues
            }          
          };
        // this.myContainer.add(this.state_combobox);
        app.down('#myContainer-id').add(state_combobox);
    },
  _getSelectedStateValues: function (){
      var app= this; 
         app.selected_state = app.down('#state-picker-id').getValue(); 
        //  app.selected_state = app.selected_state
        // console.log("selected tag_objects", tag_objects) ;
        // app.selected_tags = [];
        // for(var i = 0 ; i < tag_objects.length; i++){
        //     //  console.log("selected tag_objects", tag_objects[i].data.Name) ;
        //      app.selected_tags.push(tag_objects[i].data.Name);
        // }
        console.log("State ", app.selected_state) ;
        
        // app._loadPortfolioData();   //reset and reload 
  } ,        
});

  /** Binary search a sorted array 
   * Input: 
   *     sortedObject: object to serach  (sorted descending)
   *     key:         lookup key (property withing an object)
   *     lookup_value: value we are looking for 
   * Output
   *    -1 if key:lookup_value when there is no match 
   *    index of key:lookup_value when a match is found
  */
  function binarySearch(sortedObject, key, lookup_value){
      var start = 0;
      var end = sortedObject.length -1;
      
    //   lookup_value = parseInt(lookup_value);
    //   console.log('seraching for',key, lookup_value );
      
      while (start <= end){
          var mid = Math.floor((start + end)/2); 
          
            // console.log(" start , mid, end  ",start, mid, end); 
          
          //   var looking_at_value = parseInt(sortedObject[mid].raw[key]);
          var looking_at_value = sortedObject[mid].raw[key];
          
        //   console.log('looking_at_value',looking_at_value );
          
          if(looking_at_value === lookup_value ){
            return mid;
          }else if(lookup_value < looking_at_value  ){  // using less than operator "<" : since sortedObject is sorted in a descending order
              start = mid +1;
                // console.log('update start '); 
          }else{
              end = mid -1; 
                // console.log('update end '); 
          }
      }
      return -1; 
  }
  /**
   * completion_date:  2018-03-31T03:59:59.000Z     //  12/31/2018 23:59 EST >> 2019-01-01T04:59:59.000Z 
   * example take 2019-01-01T04:59:59.000Z   retrun 12/31/2018 23:59 EST 
   * Only cover edge cases
   *    given its midnight and its the first day of the month > revert to previous month
   *    given its midnight and its the first day of January > revert to previous month nd revert to previous year 
   *    
  */
  function convertCADateZ(zdate){
      
          var m = Number(zdate.substring(5, 7)) - 1;
          var y = Number(zdate.substring(0, 4));
          var d = Number(zdate.substring(8, 10));
          
          var time= zdate.substring(14, zdate.length);
          
        //   console.log('original date', zdate , ' year ', y,' month ', m,' day ', d,' time ', time);
          
          if((time === "59:59.000Z") && (d === 1)){ // CA agile time had increment the month > so i am roling it back 
               if(m === 0){  // check if server date was incremented from december 31 causing the year increment 
                    //roll back to december of last year
                    y--;
                    m = 11;
               }else{// roll back to prior month in the same year
                    m--; 
               }
              } 
        //   console.log('new date', new Date(y,m,1) , ' year ', y,' month ', m,' day ', d,' time ', time);
           return new Date(y,m,1);   
  }
  
   /** 
   * Serach key pair Array object  
   */
  function searchKeyPair(array_of_key_pair,key, value){
    //   console.log("searching for ",value, 'in ' , array_of_key_pair , ' using key ', key); 
      for (var i=0; i < array_of_key_pair.length; i++ ){
        //   console.log('my_grid.array_of_key_pair[',i,'][value]', array_of_key_pair[i][key]); 
          if(array_of_key_pair[i][key] === value ){
              return i;
          }
      }
      return -1; 
  }