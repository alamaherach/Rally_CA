Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    
    
    launch: function() {

    /** "Global" report variables 
        app.this_date               //today's date  
        app.report_start_date
        app.report_end_date
   
        app.months = [] ;  // month names 
        app.quarter = []   // quarter abbriviated names 
        
        app.this_month        // this month javascript index 
        app.this_quarter      // this quarter index 
        app.this_year   
        app.this_day      
        
        app.report_header = [];     // report column headers 
        app.report_header_column_size // 
        
         // data object 
        app.programs;
        app.bi;
        app.mbi;
        app.milestones;
        app.object_count // count how many object are loaded 
        app.user_tags;  // Rally tags array list of selected tag 
        
        
        app.count
        
     */
     
   
   this.flat_report = true; // true:  flatten all the month in report column.  Flase: aggragte future months into quarter 
    
   this.legend = {'No Entry':'<font color="Yellow">&#9679;&nbsp;</font>',
                  'Intake':'<font color="Black">&#9679;&nbsp;</font>', 
                  'Discovering': '<font color="Orange">&#9679;&nbsp;</font>',
                  'Delivering': '<font color="Blue">&#9679;&nbsp;</font>', 
                  'Value Realization': '<font color="lightgreen">&#x2714;&nbsp;</font>',
                  'Done': '<font color="darkgreen">&#x2714;&nbsp;</font>',

                  'Change in Delivery Date': 'brown',
                  'On Time': 'Black',
                  'Need Planned End Date': 'DarkGray',                  
                 };
                 
   this.count =  {'No Entry': 0,
                  'Intake': 0,
                  'Discovering': 0,
                  'Delivering': 0,
                  'Value Realization': 0,
                  'Done': 0,
                  
                  'Change in Delivery Date': 0,
                  'On Time': 0,
                  'Need Planned End Date': 0,
                 };  

    // this limit is used to create bucket for mbi sized 
    this.size_limit_1 = 75;
    this.size_limit_2 = 150;
    
    //Count 
    this.size_bucket_one_count   = ''.concat('# of MBIs <= ', this.size_limit_1,' points');                                //   size <= limit_1
    this.size_bucket_two_count   = ''.concat('# of MBIs > ' , this.size_limit_1,' and <= ', this.size_limit_2, ' points'); //   limit_1  < size <= limit_2 
    this.size_bucket_three_count = ''.concat('# of MBIs > ' ,this.size_limit_2, ' points');                                //    size > limit_2   
    //velocity
    this.size_bucket_one         = 'S '.concat(this.size_bucket_one  );
    this.size_bucket_two         = 'S '.concat(this.size_bucket_two  );
    this.size_bucket_three       = 'S '.concat(this.size_bucket_three);
    
    
    // console.log('this.size_bucket_one',this.size_bucket_one);
    // console.log('this.size_bucket_two',this.size_bucket_two);
    // console.log('this.size_bucket_three',this.size_bucket_three);
    // return; 
       
    
    this.this_date = new Date();
    // this.this_date = new Date('2018-10-20');
    
    this._loadTagChooser(); // load tag chooser menu
    
    this.scope = this.getContext().getProject().Name; //  "Individual Investors"; 
    console.log('main project: ', this.scope);
        
     this._setTimeline(); 
     console.log ('this_date ',this.this_date);
     console.log ('report_start_date ',this.report_start_date);
     console.log ('report_end_date ', this.report_end_date);   
     
      this.months = ['January','February','March','April','May','June','July','August','September','October','November','December'];   
      this.quarter = ['Q1','Q2','Q3','Q4'];        
  
     this._buildReportHeader(); 
     console.log('app.report_header',this.report_header);

 
    // New code 
    // this.mbi_data_table =  [
    //                         { 'Month': 'Jan:2018',  'Count': 20,  'Velocity': 700,  'On_time': 15  ,'Changed_date': 5},
    //                         { 'Month': 'Feb:2018',  'Count': 12,  'Velocity': 450,  'On_time': 10  ,'Changed_date': 2},
    //                         { 'Month': 'Mar:2018',  'Count': 13,  'Velocity': 300,  'On_time': 10  ,'Changed_date': 3},
    //                       ];
    this.mbi_data_table =  [];                // data table to be plotted in a grapgh 
    this.mbi_data_table_month_index={};       // store indexes for each month in data table, so i wont have to search the data table for given month 
    this._buildGraphDataTable();
    console.log('mbi_data_table',this.mbi_data_table); 
    // console.log('mbi_data_table_month_index',this.mbi_data_table_month_index);
    
    
 
    //End New code 
    
    // report 
    this.report = [];

    this.setLoading('Processing - Please wait ...');
    this.object_count = 0;
    this._loadProgram(); 
    this._loadBI();       
    this._loadMBI();     
    this._loadMilestones(this.report_start_date, this.report_end_date); 
    
    },
    
    /*Build data table object to be use to graph a chart */
   _buildGraphDataTable : function (){
        var app= this;
        //  { 'Month': 'Jan:2018',  'Count': 20,  'Velocity': 700,  'On_time': 15  ,'Changed_date': 5},
        var row = {}; 
        for( var i = 1; i < app.report_header.length; i++){
            // console.log(app.report_header[i]);
            //row['Index']        = i - 1;
            row['Month']                         = app.report_header[i];
            row['Count']                         = 0;
            row['On_time']                       = 0;
            row['Changed_date']                  = 0; 
            row['Need_planned_end_date']         = 0;            
            row['Velocity']                      = 0;
            row[app.size_bucket_one]             = 0;        //   bucket one velocity aggregate 
            row[app.size_bucket_two]             = 0;        //   bucket two velocity aggregate 
            row[app.size_bucket_three]           = 0;        //   bucket three velocity aggregate 
            row[app.size_bucket_one_count]       = 0;        //   bucket one item count
            row[app.size_bucket_two_count]       = 0;        //   bucket two item count
            row[app.size_bucket_three_count]     = 0;        //   bucket three item count
            app.mbi_data_table.push(row);
            row = {}; 
            // store indexes for each month, so i wont have to search the data table for given month 
            this.mbi_data_table_month_index[app.report_header[i]] = i - 1; 
        } 
       
   },
    
   /**  * Laod Tags menu  */
   _loadTagChooser : function (){
      var app = this;
      app.tag_picker =  {
                          xtype: 'rallytagpicker',
                          itemId: 'tag-picker-id',
                          alwaysExpanded: false,
                          autoExpand: false, 
                          fieldLabel: 'Tags',
                          labelWidth: 100,
                          labelAlign: 'right',
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
       
     app.add(app.tag_picker);
    //  app.add(app.selectedTag);
   },
   
     /** * get selected tag values and resun the program  */
  _getSelectedTagsValues: function (){
      var app= this; 
       var tag_objects = app.down('#tag-picker-id').getValue(); 
        // console.log("selected tag_objects", tag_objects) ;
        app.user_tags = [];
        for(var i = 0 ; i < tag_objects.length; i++){
            //  console.log("selected tag_objects", tag_objects[i].data.Name) ;
             app.user_tags.push(tag_objects[i].data.Name);
        }
        console.log("tags ", app.user_tags) ;
        
        
        //reset  objects 
        console.log(" Reset few Global varibales for clean re-run");
        app.mbi = []; 
        app.report=[];
        for (var k in app.count ){
            if (app.count.hasOwnProperty(k)) {
                 app.count[k] = 0 ;
            }
        }        
        app.object_count-- ;
        app._loadMBI();    
  } , 

   /** * set up report timeline , Start and End Date Boundaries */
   _setTimeline: function (){
      var app = this;

    //   app.months = ['January','February','March','April','May','June','July','August','September','October','November','December'];   
    //   app.quarter = ['Q1','Q2','Q3','Q4'];    
      
      // timeline start at January of current year and include the next quarter 
      app.this_month = app.this_date.getMonth();
      app.this_year = app.this_date.getFullYear(); 
      app.this_day = app.this_date.getDay(); 
      
    //   console.log ('app.this_month ',app.this_month); console.log ('app.this_year  ',app.this_year );
      /******** Time line START date  ********                  */
      var start_month = app.this_month - 3;
      var start_year = app.this_year;
      
      if(start_month < 0){
          start_month+=12;
          start_year--;
      }
    //   console.log ('start_month ',start_month); console.log ('start_year ',start_year);
      app.report_start_date = new Date(start_year , start_month  ,1); // start at the begining of the year 


      /******** Time line END date  ********      this is where i can adjust how far in the future to look ahead */
      var end_month  = app.this_month ;
      var end_year = app.this_year;
  
     // console.log ('end_month ',end_month); console.log ('end_year ',end_year);
      app.report_end_date = new Date(end_year, end_month,0);
        
  },

   /** * set up report column header,  */
  _buildReportHeader: function (){
      var app = this;
      
      console.log('_buildReportHeader');
      
    //   var year = app.this_year;
      var year = app.report_start_date.getFullYear();
      var start_index = app.report_start_date.getMonth();
      var end_index = app.report_end_date.getMonth();   
      
    //   var next_month = 0; 
     var next_month ;
    
       
     // adjust report if time line is across two years 
      if(year < app.report_end_date.getFullYear()){
         end_index = end_index  + 12;
      }
      
      app.report_header = []; 
      app.report_header.push('Program'); 
      
    //   console.log('start_index',start_index); console.log('this_month_index',this_month_index);  console.log('end_index',end_index);      
       

       for(next_month = start_index; next_month <= end_index ; next_month++ ){
             app.report_header.push(app._buildColumnName(next_month, year)); 
           }
        return;  // Done  

   },
  
  /** given a month index and a year, retun monthly column header */
  _buildColumnName: function(month_index, year){
      var app = this;
      var date = new Date(year, month_index + 1 ,0);

      return app._buildColumnNameFromDate(date);
  },
  
  /** given a full date, retun column header */
  _buildColumnNameFromDate: function(date){
      var app = this; 
      if ( (date < app.report_start_date) || (date > app.report_end_date) ){
          return false;
      }
      var year = date.getFullYear();
      var index = date.getMonth();
      
      //Account for month index reset in the next year 
      var adjusted_index = index;
      if(year > app.this_year  ){
             adjusted_index = index  + 12;
          }       
          
          
     if(app.flat_report){ // flat report no quaterly aggregate 
        return app.months[index]+': '+ year;
      }
        
    //   console.log("index",index);  console.log("adjusted_index",adjusted_index);
             
      var month_rank =  monthRankInQuarter(app.this_month);
      var month_left_in_quarter = monthLeftInQuarter(app.this_month);
      
        // console.log(app.this_month, 'month_rank',month_rank,'month_left_in_quarter',month_left_in_quarter);
      
      
      // Compute the max month index, before we start grouping month column months 
      var  max_index_before_grouping = app.this_month + month_left_in_quarter;
      if (month_rank === 3){ // if this the last month in quater, expand the next three month in hte next quarter 
          max_index_before_grouping = max_index_before_grouping + 3;  
        }
      //   console.log('max_index_before_grouping',max_index_before_grouping);
 
 
      // check if this month will be grouped in a quarter 
      if(adjusted_index > max_index_before_grouping){
         var current_quarter_index = quarterOfTheYear(index) -1;     
         return app.quarter[current_quarter_index]+': '+ year;
      }
       return app.months[index]+': '+ year;
  },
  
   /** * Rally API call to get Portfolio/Program item data store */
  _loadProgram:function (){
        var app = this;
        // var program_filter =  Rally.data.wsapi.Filter.fromQueryString('(FormattedID = "P20")'); 
        
         Ext.create('Rally.data.wsapi.Store', {
            model: 'portfolioitem/Program',            
            autoLoad: true,
            // filters: program_filter,    
            limit: Infinity,
            sorters: [
                        { property: 'Rank', direction: 'ASC'   }
                     ],             
            enableHierarchy: true,
            listeners: { 
                load: function(store, data) {
                    //   console.log("  Programs items " , data);    
                    app.object_count++;
                    app.programs = data; 
                    app._start('Program');
                },
                scope: app
            },
            fetch: ['FormattedID', 'Name', 'Milestones','State','PlannedEndDate','Children']
            // fetch: ['FormattedID', 'Milestones','State','PlannedEndDate','Children']
        });  
    },    

   /** * Rally API call to get Portfolio/Program item data store */
  _loadBI:function (){
        var app = this;
        // var bi_filter =  Rally.data.wsapi.Filter.fromQueryString('(FormattedID = "B208")');    
        
         Ext.create('Rally.data.wsapi.Store', {
            model: 'portfolioitem/BI',            
            autoLoad: true,
            // filters: bi_filter,               
            limit: Infinity,
            listeners: { 
                load: function(store, data) {
                    // console.log("  BI items " , data);                    
                    app.object_count++;
                    app.bi = data; 
                    app._start('BI');
                },
                scope: app
            },
            // fetch: ['FormattedID', 'Name', 'Milestones','State','PlannedEndDate','PlannedStartDate','ActualEndDate','ActualStartDate']
        });  
    },    
    
   /** * Rally API call to get Portfolio/MBI item data store */
  _loadMBI:function (){
        var app = this;


        // Filter by project scope 
         var mbi_filter1 =  Rally.data.wsapi.Filter.fromQueryString('(Project.Name  = "'+ app.scope   +'")'); 
         var mbi_filter2 =  Rally.data.wsapi.Filter.fromQueryString('(c_PrimaryTeam = "'+  app.scope  +'")'); 
         var myFilter = mbi_filter1.or(mbi_filter2); 


        
        // Filter by tags  
        if ((typeof app.user_tags !== "undefined") && (app.user_tags.length > 0) ) { // app.user_tags = undefined. Tag has not been selected yet . skip filter 
            //  console.log("MbI app.user_tags ", app.user_tags);
             var mbi_filter3 = Rally.data.wsapi.Filter.fromQueryString('(Tags.Name  = "'+ app.user_tags[0] +'")'); 
             for(var i = 1 ; i < app.user_tags.length ; i++){
                 mbi_filter3 =  mbi_filter3.or(Rally.data.wsapi.Filter.fromQueryString('(Tags.Name  = "'+ app.user_tags[i] +'")')); 
             } 
             myFilter = (mbi_filter3).and(myFilter); 
        }
        
        //filter by state 
         var mbi_filter4 = Rally.data.wsapi.Filter.fromQueryString('(state = "Done")');
         var mbi_filter5 = Rally.data.wsapi.Filter.fromQueryString('(state = "Value Realization")');
          myFilter = (mbi_filter4.or(mbi_filter5)).and(myFilter); 
        
        //  console.log("MbI myFilter ", myFilter);   
        
        //  var mbi_filter3 =  Rally.data.wsapi.Filter.fromQueryString('(FormattedID = "M471")');  
        // var mbi_filter4 =  Rally.data.wsapi.Filter.fromQueryString('(Tags.Name = "Strategic")');
        // var mbi_filter5 =  Rally.data.wsapi.Filter.fromQueryString('(Tags.Name = "RUB")');
        // var testFilter = (mbi_filter4.or(mbi_filter5)).and(myFilter);
        // console.log("MbI testFilter ", testFilter); 
        // // var testFilter =  mbi_filter1.or(mbi_filter2).and(mbi_filter3);
        

        // var mbi_filter8 =  Rally.data.wsapi.Filter.fromQueryString('(FormattedID = "M953")');   // Strategic
        // var mbi_filter9 =  Rally.data.wsapi.Filter.fromQueryString('(FormattedID = "M1189")'); //RUB
        // var testFilter = myFilter.and(mbi_filter8.or(mbi_filter9));
          
        //   myFilter =  Rally.data.wsapi.Filter.fromQueryString('(FormattedID = "M1329")');  // Delete me
        
         Ext.create('Rally.data.wsapi.Store', {
            model: 'portfolioitem/MBI',
            filters: myFilter,            
            autoLoad: true,
            limit: Infinity,
            sorters: [
                        { property: 'Parent.FormattedID', direction: 'DESC'   }
                     ],             
            listeners: { 
                 load: function(store, data) {
                     console.log("  MBI items count " , data.length);   
                     app.object_count++;
                     app.mbi = data;    
                     app._start('MBI');
                },
                scope: app
            },
            // fetch: ['Parent','FormattedID', 'Name','State','PlannedEndDate','PlannedStartDate','ActualEndDate','ActualStartDate','Predecessors','Successors']
             fetch: ['AcceptedLeafStoryPlanEstimateTotal','AcceptedLeafStoryCount','Project','Parent','FormattedID', 'Name', 'Milestones','State','PlannedEndDate','PlannedStartDate','ActualEndDate','ActualStartDate','Predecessors','Successors']
        });  
    },      
    
   /** * Rally API call to get Portfolio item data store */
  _loadMilestones:function (start_date, end_date){
        var app = this;
        

       // test filter to be deleted
        // var ms_filter1 =  Rally.data.wsapi.Filter.fromQueryString('(FormattedID = "MI118")');
        // var ms_filter2 =  Rally.data.wsapi.Filter.fromQueryString('(FormattedID = "MI117")');
        // var ms_filters =  ms_filter1.or(ms_filter2);
        
        
       
        
        // Milstone Filter 
        // var ms_filter1 =  Rally.data.wsapi.Filter.fromQueryString('(TargetDate >= "2017-1-1")'); 
        // var ms_filter2 =  Rally.data.wsapi.Filter.fromQueryString('(TargetDate <= "2017-12-31")');
        var cond1 = '(TargetDate >= "'.concat(start_date.getFullYear(), '-' , start_date.getMonth() + 1, '-' , start_date.getDate() , '")' ); 
        var cond2 = '(TargetDate <= "'.concat(end_date.getFullYear()  , '-' , end_date.getMonth()   + 1 , '-' , end_date.getDate()  , '")' );
        
        var ms_filter1 =  Rally.data.wsapi.Filter.fromQueryString(cond1 ); 
        var ms_filter2 =  Rally.data.wsapi.Filter.fromQueryString(cond2 ); 
        var ms_filters =  ms_filter1.and(ms_filter2);//.and(ms_filter3);
  
        

        Ext.create('Rally.data.wsapi.Store', {
            model: 'Milestone',    
            filters: ms_filters,            
            autoLoad: true,
            limit: Infinity,
            sorters: [
                        // { property: 'Parent.FormattedID', direction: 'ASC'   }
                        //   { property: 'FormattedID', direction: 'ASC'   }
                         { property: 'ObjectID', direction: 'ASC'   }
                     ],             
            listeners: { 
                load: function(store, data) {
                    //   console.log("  Milestone " , data);  
                    app.object_count++;
                    app.milestones = data;    
                    app._start('Milestones');
                    
                },
                scope: app
            },
            // fetch: ['FormattedID', 'Name', 'UserStories:Summary(ScheduleState)', 'PreliminaryEstimateValue', 'LeafStoryPlanEstimateTotal', 'UnEstimatedLeafStoryCount']
            fetch: ['Projects','TargetDate','Summary','CreationDate','TargetProject','TotalArtifactCount','TotalProjectCount','Name','FormattedID','ObjectUUID']
        });  
    },       

   /** * main method , start computing when all data is loaded  */
  _start:function(from){
        var app = this; 
        
        // app.object_count = 0; // dont run the program  // testing and debuggin 
        
        if(app.object_count !== 4){ // data still loding 
            // console.log('Not ready to start, still loading data :', from);
            return;
        }
         
         // data has finished loading 
         console.log('Data load completed at' , from ,' processing has started ');
         console.log('programs'  ,  app.programs  );
         console.log('BI      '   , app.bi  );
         console.log('MBI      '  , app.mbi  );
         console.log('milestones'  , app.milestones); 
         
         /**************************  Process MBI to data table************************************************************ */
         for(var i = 0; i < app.mbi.length ; i++){
             // get MBI report row header (the key) 
             var mbi_report_columns =  app._getMbiReportColumnKey(app.mbi[i]);
            //  console.log(" keys ", mbi_report_columns, " MBI ", app.mbi[i].data.FormattedID); 
             
             // add MBI to report contents
              if( mbi_report_columns !== -1){
                 app._addMBItoDataTable(app.mbi[i], mbi_report_columns);
              }    
         }
        
        
        //change on time to percent
        for (i=0; i < app.mbi_data_table.length ; i++){
            app.mbi_data_table[i]['On_time'] = +(((app.mbi_data_table[i]['On_time']  / app.mbi_data_table[i]['Count']) * 100).toFixed(2)) ; 
        }

         
        console.log('app.mbi_data_table', app.mbi_data_table);
        app._drawChart(app.mbi_data_table);
        app.setLoading(false);   
        
    },
  
  /* take mbi object and return the report column header it belong too otherwise retuns -1 if this MBI is not associated with any milstone
   also compute some business logic on the MBI state*/ 
  _getMbiReportColumnKey:function(mbi){
      var app = this;
      var i = 0; // some reuasable index; 
      
      // Get milestone ObjectID *************************************************************
      if (typeof mbi.raw.Milestones === "undefined") {
          console.log("Skip MBI - no milestone is assigned ", mbi.raw.FormattedID);
          return -1;
         }
         
      //get MBI milestone ObjectIDs  // mbi may belong to one or many milestones 
      var mbi_ms_objectIDs=[];
      for (i = 0; i < mbi.raw.Milestones._tagsNameArray.length; i++ ){
           var start = mbi.raw.Milestones._tagsNameArray[i]._ref.lastIndexOf("/") + 1; 
           mbi_ms_objectIDs.push(parseInt(mbi.raw.Milestones._tagsNameArray[i]._ref.substring(start) ) ); 
      }
      //   console.log('MBI milstone ObjectID  '  , mbi_ms_objectIDs);
      
      // get milestone object index from milestone array using its objectID  ********************************** 
      var mbi_ms_indecies =[]; 
      var ms_index; 
      for (i = 0; i < mbi_ms_objectIDs.length; i++ ){
          ms_index = binarySerach(app.milestones,'ObjectID',mbi_ms_objectIDs[i]); 
          if(ms_index !== -1){
              mbi_ms_indecies.push(ms_index);
          }
      }
        // console.log(' milstone index  '  , mbi_ms_indecies);
      
     // get milestone(s) target date ***************************************************
     var mbi_ms_target_dates=[]; 
     var index; 
     for (i = 0; i < mbi_ms_indecies.length; i++ ){
         index = mbi_ms_indecies[i]; 
         if (typeof app.milestones[index].data.TargetDate !== "undefined") { // check if MS target date is defined
            mbi_ms_target_dates.push(app.milestones[index].data.TargetDate); 
         }
     }
    //   console.log('MBI milestones  target date  '  , mbi_ms_target_dates); 

    // get column header based on each milestone target date *********************
    var mbi_columns_new=[]; 
    var row={};
    var mbi_column; 
     
    for (i = 0; i < mbi_ms_target_dates.length; i++ ){
         row = {}; // reset
        // Get column header and based on mileston target date 
        mbi_column = app._buildColumnNameFromDate(mbi_ms_target_dates[i]);
        
        if(mbi_column){ 
            row['column_key'] = mbi_column;   
            // state will reflect if MBI has Change in Delivery Date 
            row['state']  = -1;  //assume  invalid MBI  PlannedEndDate
            
            // Check if MBI has a Change in Delivery Date  
            // An MBI can be assigned to more than one milsetone (MS), two or more MS my have same target date month (maybe different days)
                    // in this case state of MBI will refelct the worse case scenario 
            // -1 : invalid MBI  PlannedEndDate  |  0: on scehdule    | 1 : Change in Delivery Date 
            if( mbi.data.PlannedEndDate !== null   &&  mbi.data.PlannedEndDate  !== '' ){    
                // console.log('valid MBI  PlannedEndDate : ', mbi.data.PlannedEndDate, " MS date" ,mbi_ms_target_dates [i]   ); 
                if(mbi.data.PlannedEndDate < mbi_ms_target_dates [i] ){ // MBI Change in Delivery Date 
                  row['state']  = 1;  // MBI Change in Delivery Date 
                 }else  if(mbi.data.PlannedEndDate >= mbi_ms_target_dates [i] ){ // MBI on  schedule 
                  row['state']  = 0;  // MBI on  schedule 
                }               
            }  //else:  invalid MBI  PlannedEndDate as assumed 

           // Check if this is a new column key or its already been caputred for this mbi 
           var y = -1; 
           for(var xx = 0; xx < mbi_columns_new.length; xx++ ){
               
               // check if milestone key already captured 
               if (typeof mbi_columns_new[xx] !== "undefined" &&  mbi_columns_new[xx]['column_key'] === mbi_column) { 
                   // match found
                    y = xx; 
                    xx = mbi_columns_new.length; // quit the loop 
                    // console.log('prevent double entry ', mbi.data.FormattedID);
               }
           }

           // add row to result if new 
           // otherwise update state  with worse case scenario since mbi can be assigned to more than on milesone that have target date in same month
           if(y === -1){ // this milestone key column  is new (we have not seen this before for thie MBI)
               mbi_columns_new.push(row);
           }else{ // Update state with worse case scenario 
               if(row['state'] < mbi_columns_new[y]['state'] ){
                    mbi_columns_new[y]['state'] = row['state'] ; 
                    // console.log('"on time "State override with worse case scenario', mbi.data.FormattedID);
               }
           }     
        }
    }
     
      if(mbi_columns_new.length === 0){ // no Milestone is found , discard this MBI 
          console.log("Skip MBI - milestone(s) target date out of range OR mbi has no milestone: ", mbi.data.FormattedID);
          return -1; 
      }        
     
    //  console.log('mbi_columns_old '  , mbi_columns_old); 
    //  console.log('mbi_columns_new '  , mbi_columns_new); 
     return mbi_columns_new; // everything went well we found report column header 'key' where mbi need to go 
  },
  
  /* populate data table 
  columns is an array of columns/X-axis the MBI belong to */ 
  _addMBItoDataTable:function(mbi, columns){
      //mbi_data_table 
      
      var app = this;
      if (columns.length > 2) {
          console.log('Multi milestones', mbi.data.FormattedID );
      }
      console.log('processing mbi for report', mbi.data.FormattedID );
      console.log('report / ms based columns', columns );

 
      
      var report_index = -1;
      for (var i = 0; i < columns.length ; i++){
          report_index = app.mbi_data_table_month_index[columns[i].column_key];
          
          app.mbi_data_table[report_index]['Count']+= 1;
          
          app.mbi_data_table[report_index]['Velocity']+= mbi.data.AcceptedLeafStoryPlanEstimateTotal;
          // velcoity bucket
          if(mbi.data.AcceptedLeafStoryPlanEstimateTotal <= app.size_limit_1 ){
              app.mbi_data_table[report_index][app.size_bucket_one]+= mbi.data.AcceptedLeafStoryPlanEstimateTotal;
              
              app.mbi_data_table[report_index][app.size_bucket_one_count]+= 1;

          }else if((mbi.data.AcceptedLeafStoryPlanEstimateTotal > app.size_limit_1) && (mbi.data.AcceptedLeafStoryPlanEstimateTotal <= app.size_limit_2)){
               app.mbi_data_table[report_index][app.size_bucket_two]+= mbi.data.AcceptedLeafStoryPlanEstimateTotal;
               
               app.mbi_data_table[report_index][app.size_bucket_two_count]+= 1;
               
          }else{
               app.mbi_data_table[report_index][app.size_bucket_three]+= mbi.data.AcceptedLeafStoryPlanEstimateTotal;
               
               app.mbi_data_table[report_index][app.size_bucket_three_count]+= 1;
          }


          if(columns[i]['state'] === 1){ // Change in Delivery Date
              app.mbi_data_table[report_index]['Changed_date']+= 1;
          }else if(columns[i]['state'] === 0){ // MBI delivered on time
              app.mbi_data_table[report_index]['On_time']+= 1;
          }else{ // columns[i]['state'] === -1
             app.mbi_data_table[report_index]['Need_planned_end_date']+= 1;
          }


      }
  },

  _drawChart: function(mbi_data_table){
   var app = this;
      
     if( app.my_graph_chart){ // if my_graph_chart object does exit, get rid of it 
        console.log("Destroy my_graph_chart ") ;
        app.my_graph_chart.destroy();
    }
    
    // if (typeof app.my_graph_chart !== "undefined") {
    //       console.log("Destroy my_graph_chart ") ;
    //         app.my_graph_chart.destroy();
    //     }
        
   // ********  set up data table  

    //   var mbi_data_table =  [
    //                             { 'Month': 'Jan:2018',  'Count': 20,  'Velocity': 700,  'On_time': 15  ,'Changed_time': 5},
    //                             { 'Month': 'Feb:2018',  'Count': 12,  'Velocity': 450,  'On_time': 10  ,'Changed_time': 2},
    //                             { 'Month': 'Mar:2018',  'Count': 13,  'Velocity': 300,  'On_time': 10  ,'Changed_time': 3},
    //                         ];

    // var data_table_columns = ['Month', 'Count', 'On_time','Changed_time','Need_planned_end_date','Velocity', app.size_bucket_one, app.size_bucket_two, app.size_bucket_three];
    
    var data_table_columns = ['Month', 'Count', 'On_time','Changed_time','Need_planned_end_date','Velocity', app.size_bucket_one, app.size_bucket_two, app.size_bucket_three, app.size_bucket_one_count,app.size_bucket_two_count, app.size_bucket_three_count];

    

    
    // build stor based on result data table 
    var store = Ext.create('Ext.data.JsonStore', {
            fields: data_table_columns,
            data: mbi_data_table,
        });
        
        
    // ********  set up the chart 
    
    // config Series 
    var my_series =  [
                        //  {
                        //     type: 'line',   // bar (horizental)      column (vertical)
                        //     axis: ['On_time'],
                        //     xField: 'Month',
                        //     // yField: ['Count', 'On_time','Changed_time','Need_planned_end_date','Velocity'],
                        //     yField: ['On_time'],
                        //     highlight: true,
                        //     label: {
                        //             display: 'insideEnd',
                        //             // field:   ['Count', 'On_time','Changed_time','Need_planned_end_date','Velocity'],
                        //             field:   ['On_time'],
                        //             renderer: Ext.util.Format.numberRenderer('10'),
                        //             orientation: 'horizontal',  //horizontal     vertical
                        //             color: 'black',
                        //             // font :'{font-weight: bold;}',
                        //             'text-anchor': 'middle'
                        //          },
                        // },
                        
                        
                          {
                            type: 'column',
                            axis: [ app.size_bucket_one_count, app.size_bucket_two_count, app.size_bucket_three_count],
                            highlight: true,
                            xField: 'Month',
                            yField: [ app.size_bucket_one_count, app.size_bucket_two_count, app.size_bucket_three_count],
                            stacked:true, 
                            label: {
                                    display: 'insideEnd',
                                    field:   [ app.size_bucket_one_count, app.size_bucket_two_count, app.size_bucket_three_count],
                                    renderer: Ext.util.Format.numberRenderer('10'),
                                    orientation: 'horizontal',  //horizontal     vertical
                                    color: 'black',
                                    // font :'{font-weight: bold;}',
                                    'text-anchor': 'middle'
                                 },
                         },
                        
                          {
                            type: 'line',
                            axis: ['On_time'],  // left
                            highlight: true,
                            xField: 'Month',
                            yField: [ 'On_time'],
                            stacked:true, 
                            tips: {
                                  trackMouse: true,
                                  //   width: 140,
                                  //   height: 28,
                                  renderer: function(storeItem) {
                                            // this.setTitle( "Throughput :" +storeItem.get('count') + ': \nVelocity: ' + storeItem.get('velocity')   );
                                            this.setTitle( storeItem.get('On_time')   );
                                  }
                                 },
                            label: {
                                    display: 'insideEnd',
                                    field:   [ 'On_time'],
                                    renderer: Ext.util.Format.numberRenderer('10'),
                                    orientation: 'horizontal',  //horizontal     vertical
                                    color: 'black',
                                    // font :'{font-weight: bold;}',
                                    'text-anchor': 'middle'
                                 },
                         },
                        
                        //   {
                            // type: 'column',
                            // axis: [ app.size_bucket_one,app.size_bucket_two,app.size_bucket_three],
                            // xField: 'Month',
                            // yField: [ app.size_bucket_one,app.size_bucket_two,app.size_bucket_three],
                            // highlight: true,
                            // stacked:true, 
                            // label: {
                            //         display: 'insideEnd',
                            //         field:   [ app.size_bucket_one,app.size_bucket_two,app.size_bucket_three],
                            //         renderer: Ext.util.Format.numberRenderer('10'),
                            //         orientation: 'horizontal',  //horizontal     vertical
                            //         color: 'black',
                            //         // font :'{font-weight: bold;}',
                            //         'text-anchor': 'middle'
                            //      },
                        //  },

                        //  {
                        //     type: 'line',
                        //     axis: 'left',
                        //     highlight: true,
                        //     xField: 'Month',
                        //     yField: 'On_time',
                        //     markerConfig: {
                        //         type: 'circle',
                        //         size: 3
                        //     }
                        // },
                    
                    ];
                    
        var my_axes = [
                        { 
                            type: 'Category',
                            position: 'bottom',  // left   bottom
                            fields: ['Month'],
                            title: 'Months'
                            
                        }, 
                        { 
                            type: 'Numeric',
                            position: 'left', // left    bottom  
                            // fields: ['Count', 'Velocity','On_time','Changed_time'],
                            fields: [ app.size_bucket_one_count, app.size_bucket_two_count, app.size_bucket_three_count],
                            stacked:true, 
                            label: { renderer: Ext.util.Format.numberRenderer('0,0') },
                            title: '# of MBIs',
                            grid: false,
                            minimum: 0
                        },
                        { 
                            type: 'Numeric',
                            position: 'right',  // left   bottom
                            fields: ['On_time'],
                            title: '% on time'
                        }
                    ];        
 
    // Create Chart
       app.my_graph_chart = Ext.create('Ext.chart.Chart', {
            renderTo: Ext.getBody(),
            width: 600,
            height: 400,
            animate: true,
            store: store,
            axes: my_axes, 
            series:my_series, 
            legend: {
                position: 'right'
            },
        });  
        
        app.add(app.my_graph_chart); 
    },
});


  /* *Get the quarter of the year */ 
  function quarterOfTheYear(month) {
    var quarter = Math.ceil((month +1) / 3);
    // console.log("quarter ", quarter);
    return quarter;
  }

  /** takes month javascript index and returns: 
   * rank in a quarter 1: first month in a quater, 2: mid , 3: Last month in a quater */ 
  function monthRankInQuarter(month) {
    return (month%3) + 1;
  }
  
  /**  * given a month retun how many month left in quater
       exampl given jan return 2 ; given feb return 1 ; given march return 0   */
  function monthLeftInQuarter (month){
  
   if((month % 3) === 0 ) /* next month is FIRST month in quarter      this_month  = 3 or 6 or 9 or 12 */{ 
       return 2 ;
   }else if ((month % 3) === 1) /* next month is MID month in quarter  this_month  = 1 or 4 or 7 or 10 */ {
       return 1 ;
   }else if ((month % 3) === 2)/* next month is LAST month in quarter  this_month  = 2 or 5 or 8 or 11 */ { 
       return 0 ;
   }else { console.log('Something went wrong, this should never get executed'); }
      
  }

  /** * Binary search an array */
  function binarySerach(sortedObject, key, lookup_value){
      var start = 0;
      var end = sortedObject.length -1;
      
    //   lookup_value = parseInt(lookup_value);
    //   console.log('seraching for',key, lookup_value);
      
      while (start <= end){
          var mid = Math.floor((start + end)/2); 
          
        //   console.log(" start , mid, end  ",start, mid, end); 
          
          //   var looking_at_value = parseInt(sortedObject[mid].data[key]);
          var looking_at_value = sortedObject[mid].data[key];
        
          // console.log('looking_at_value',looking_at_value );
          
          if(looking_at_value === lookup_value ){
            //   return sortedObject[mid].data;
            return mid;
          }else if(lookup_value > looking_at_value  ){
              start = mid +1;
             //   console.log('update start '); 
          }else{
              end = mid -1; 
             //   console.log('update end '); 
          }
      }
      return -1; 
  }
  