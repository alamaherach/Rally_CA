Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        //Write app code here

        this.setLoading('Processing - Please wait ...');

        // this.this_date = new Date();
          this.this_date = new Date('2018-1-20');
        
        
        this._loadTagChooser();
        
        this.scope = this.getContext().getProject().Name; //  "Individual Investors"; 
        console.log('main project: ', this.scope);
        
        this._setTimeline(); 
        console.log ('this_date ',this.this_date);
        console.log ('report_start_date ',this.report_start_date);
        console.log ('report_end_date ', this.report_end_date);  
        
         this.mbi_data_table=[];         /* Core Data table of report */  //  { 'Month': 'Jan:2018',  'Count': 20,  'Velocity': 700,  'On_time': 15  ,'Changed_time': 5}
        
        this.object_count = 0;
        this._loadProgram(); 
        this._loadBI();       
        this._loadMBI();     
        this._loadMilestones(this.report_start_date, this.report_end_date); 

        this._drawChartTemplate2();
        
        this.setLoading(false);   
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
             console.log("selected tag_objects", tag_objects[i].data.Name) ;
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
        // app._loadMBI();    
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
        //   if(end_month < 0){
        //           end_month+=12;
        //           end_year--;
        //       }      
    // console.log ('end_month ',end_month); console.log ('end_year ',end_year);
      app.report_end_date = new Date(end_year, end_month,0);
        
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


        // MBI Filter 
         var mbi_filter1 =  Rally.data.wsapi.Filter.fromQueryString('(Project.Name  = "'+ app.scope   +'")'); 
         var mbi_filter2 =  Rally.data.wsapi.Filter.fromQueryString('(c_PrimaryTeam = "'+  app.scope  +'")'); 
         
         
        //  var mbi_filter3 =  Rally.data.wsapi.Filter.fromQueryString('(StateChangedDate >= "2017-09-01T23:59:59.000Z") '); 
        //  var mbi_filter4 =   Rally.data.wsapi.Filter.fromQueryString('(StateChangedDate <= "2017-11-30T23:59:59.000Z") '); 
         
         var mbi_filter5 =  Rally.data.wsapi.Filter.fromQueryString('(State = "Done") '); 
         var mbi_filter6 =  Rally.data.wsapi.Filter.fromQueryString('(State = "Value Realization") '); 
         
        // var myFilter = (mbi_filter1.or(mbi_filter2)).and(mbi_filter3).and(mbi_filter4).and(mbi_filter5.or(mbi_filter6));
        var myFilter = (mbi_filter1.or(mbi_filter2)).and(mbi_filter5.or(mbi_filter6));
        //  var myFilter = mbi_filter1.or(mbi_filter2); 


       //((Tags.Name = "Strategic") OR (Tags.Name = "RUB"))
       // 

        
        /* Get tags filter */
        if ((typeof app.user_tags !== "undefined") && (app.user_tags.length > 0) ) { // app.user_tags = undefined. Tag has not been selected yet . skip filter 
             console.log("MbI app.user_tags ", app.user_tags);
             var temp_filter = Rally.data.wsapi.Filter.fromQueryString('(Tags.Name  = "'+ app.user_tags[0] +'")'); 
             for(var i = 1 ; i < app.user_tags.length ; i++){
                 temp_filter =  temp_filter.or(Rally.data.wsapi.Filter.fromQueryString('(Tags.Name  = "'+ app.user_tags[i] +'")')); 
             } 
             myFilter = (temp_filter).and(myFilter); 
        }
        
         console.log("MbI myFilter ", myFilter);   
        

        
        
         Ext.create('Rally.data.wsapi.Store', {
            model: 'portfolioitem/MBI',
            filters: myFilter,            
            autoLoad: true,
            limit: Infinity,
            sorters: [
                        {property: 'StateChangedDate', direction: 'DESC'   }
                        // { property: 'Parent.FormattedID', direction: 'DESC'   } 
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
    
            //  fetch: ['Project','Parent','FormattedID', 'Name', 'Milestones','State','PlannedEndDate','PlannedStartDate','ActualEndDate','ActualStartDate','Predecessors','Successors']
        });  
    },      
    
   /** * Rally API call to get Portfolio item data store */
  _loadMilestones:function (start_date, end_date){
        var app = this;
        
        // Milstone Filter 
        // var ms_filter1 =  Rally.data.wsapi.Filter.fromQueryString('(TargetDate >= "2017-09-01T23:59:59.000Z")'); 
        // var ms_filter2 =  Rally.data.wsapi.Filter.fromQueryString('(TargetDate <= "2017-11-30T23:59:59.000Z")');
        
        console.log("start_date",start_date);console.log("end_date",end_date);
        
        var cond1 = '(TargetDate >= "'.concat(start_date.getFullYear(), '-' , start_date.getMonth() + 1, '-' , start_date.getDate() , "T23:59:59.000Z", '")' ); 
        var cond2 = '(TargetDate <= "'.concat(end_date.getFullYear()  , '-' , end_date.getMonth()   + 1 , '-' , end_date.getDate()  , "T23:59:59.000Z", '")' );
        var ms_filter1 =  Rally.data.wsapi.Filter.fromQueryString(cond1 ); 
        var ms_filter2 =  Rally.data.wsapi.Filter.fromQueryString(cond2 ); 
        
        var ms_filters =  ms_filter1.and(ms_filter2);//.and(ms_filter3);
        // console.log("ms_filters",ms_filters);
        

        Ext.create('Rally.data.wsapi.Store', {
            model: 'Milestone',    
            filters: ms_filters,            
            autoLoad: true,
            limit: Infinity,
            sorters: [
                        // { property: 'Parent.FormattedID', direction: 'ASC'   }
                        //   { property: 'FormattedID', direction: 'ASC'   }
                         { property: 'TargetDate', direction: 'ASC'   }
                     ],             
            listeners: { 
                load: function(store, data) {
                    //   console.log("  Milestone " , data);  
                    app.object_count++;
                    app.milstones = data;    
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
            console.log('Not ready to start, still loading data :', from);
            return;
        }
         
         // data has finished loading 
         console.log('Data load completed at' , from ,' processing has started ');
         console.log('programs'  ,  app.programs  );
         console.log('BI      '   , app.bi  );
         console.log('MBI      '  , app.mbi  );
         console.log('milstones'  , app.milstones); 
         
           
       
      /**************************  Process MBI ************************************************************ */
       for(var i = 0; i < app.mbi.length ; i++){
             // get MBI report row header (the key) 
           
         }
         

    },
    
  _drawChartTemplate2: function(){
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

  var MBI_data_table =  [
                        { 'Month': 'Jan:2018',  'Count': 20,  'Velocity': 700,  'On_time': 15  ,'Changed_time': 5},
                        { 'Month': 'Feb:2018',  'Count': 12,  'Velocity': 450,  'On_time': 10  ,'Changed_time': 2},
                        { 'Month': 'Mar:2018',  'Count': 13,  'Velocity': 300,  'On_time': 10  ,'Changed_time': 3},
                    ];
    var data_table_columns = ['Month', 'Count', 'Velocity','On_time','Changed_time'];
    

    
    // build stor based on result data table 
    var store = Ext.create('Ext.data.JsonStore', {
            fields: data_table_columns,
            data: MBI_data_table,
        });
        
        
    // ********  set up the chart 
    
    // config Series 
    var my_series =  [
                         {
                            type: 'column',   // bar (horizental)      column (vertical)
                            axis: 'left',
                            highlight: true,
                            // stacked: true,   // TBD
                            // showInLegend: true, 
                            // tips: {
                            //       trackMouse: true,
                            //     //   width: 140,
                            //       //   height: 28,
                            //       renderer: function() {
                            //         //   console.log(item);
                            //     //   this.setTitle(storeItem.get('name') + ': ' + storeItem.get('data') + ' adil'  );
                            //       }
                            //      },
                            label: {
                                    display: 'insideEnd',
                                    field:   ['Count', 'Velocity', 'On_time', 'Changed_time'],
                                    renderer: Ext.util.Format.numberRenderer('10'),
                                    orientation: 'horizontal',  //horizontal     vertical
                                    color: 'black',
                                    // font :'{font-weight: bold;}',
                                    'text-anchor': 'middle'
                                 },
                            // listeners: {
                            //             'afterrender': function() {
                            //                     console.log('afterrender barchart');
                            //               }, 
                            //             },
                            xField: 'Month',
                            yField: ['Count', 'Velocity','On_time', 'Changed_time'],
                        },
                        // {
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

                        //  {
                        //     type: 'line',
                        //     axis: 'left',
                        //     highlight: true,
                        //     xField: 'Month',
                        //     yField: 'Changed_time',
                        //     markerConfig: {
                        //         type: 'circle',
                        //         size: 3
                        //     }
                        // },
                    
                    ];
                    
        var my_axes = [{ 
                        type: 'Category',
                        position: 'bottom',  // left   bottom
                        fields: ['Month'],
                        title: 'MBIs Metrics'
                    }, { 
                      type: 'Numeric',
                        position: 'left', // left    bottom  
                        fields: ['Count', 'Velocity','On_time','Changed_time'],
                        stacked:true, 
                        label: { renderer: Ext.util.Format.numberRenderer('0,0') },
                        title: 'Aggregated Values',
                        grid: false,
                        minimum: 0
                    }];        
 
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
                position: 'top'
            },
        });  
        
        app.add(app.my_graph_chart); 
    },
    
  _drawChartTemplate: function(){
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

  var data_table =  [
                        { 'iteration': 'sprint one',   'team1': 18, 'team2': 12, 'sum': 12  ,'mean': 30},
                        { 'iteration': 'sprint two',   'team1': 24,  'team2': 22,  'sum': 22 ,'mean': 46},
                        { 'iteration': 'sprint three', 'team1': 15,  'team2': 12,  'sum': 12   ,'mean': 27},
                        { 'iteration': 'sprint four',  'team1': 12,  'team2': 14, 'sum': 12  ,'mean': 26},
                        { 'iteration': 'sprint five',  'team1': 27, 'team2': 38, 'sum': 27     ,'mean': 65},
                    ];
    var data_table_columns = ['iteration', 'team1', 'team2','sum','mean'];
    
    // build stor based on result data table 
    var store = Ext.create('Ext.data.JsonStore', {
            fields: data_table_columns,
            data: data_table,
        });
        
        
    // ********  set up the chart 
    
    // config Series 
    var my_series =  [
                         {
                            type: 'column',   // bar (horizental)      column (vertical)
                            axis: 'left',
                            highlight: true,
                            // stacked: true,   // TBD
                            // showInLegend: true, 
                            // tips: {
                            //       trackMouse: true,
                            //     //   width: 140,
                            //       //   height: 28,
                            //       renderer: function() {
                            //         //   console.log(item);
                            //     //   this.setTitle(storeItem.get('name') + ': ' + storeItem.get('data') + ' adil'  );
                            //       }
                            //      },
                            label: {
                                    display: 'insideEnd',
                                    field:   ['team1', 'team2'],
                                    renderer: Ext.util.Format.numberRenderer('10'),
                                    orientation: 'horizontal',  //horizontal     vertical
                                    color: 'black',
                                    // font :'{font-weight: bold;}',
                                    'text-anchor': 'middle'
                                 },
                            // listeners: {
                            //             'afterrender': function() {
                            //                     console.log('afterrender barchart');
                            //               }, 
                            //             },
                            xField: 'iteration',
                            yField: ['team1', 'team2'],
                        },
                        {
                            type: 'line',
                            axis: 'left',
                            highlight: true,
                            xField: 'iteration',
                            yField: 'sum',
                            markerConfig: {
                                type: 'circle',
                                size: 3
                            }
                        },

                         {
                            type: 'line',
                            axis: 'left',
                            highlight: true,
                            xField: 'iteration',
                            yField: 'mean',
                            markerConfig: {
                                type: 'circle',
                                size: 3
                            }
                        },
                    
                    ];
                    
        var my_axes = [{ 
                        type: 'Category',
                        position: 'bottom',  // left   bottom
                        fields: ['iteration'],
                        title: 'Sample Metrics'
                    }, { 
                      type: 'Numeric',
                        position: 'left', // left    bottom  
                        fields: ['team1', 'team2','sum','mean'],
                        stacked:true, 
                        label: { renderer: Ext.util.Format.numberRenderer('0,0') },
                        title: 'Sample Values',
                        grid: true,
                        minimum: 0
                    }];        
 
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
                position: 'top'
            },
        });  
        
        app.add(app.my_graph_chart); 
    },
    
});

