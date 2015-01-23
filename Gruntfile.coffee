'use strict'

module.exports = (grunt) ->

  # Configure paths
  config =
    src: 'src'
    lib: 'lib'
    dist: 'dist'
    test: 'test'

  # Define the configuration for all the tasks
  grunt.initConfig
    # Project settings
    config: config

    # Watch files for changes and runs related tasks
    watch:
      coffee:
        files: ['<%= config.src %>/*.coffee']
        tasks: ['newer:coffee:compile']
      jshint:
        files: ['<%= config.lib %>/*.js']
        tasks: ['newer:jshint']
      test:
        files: ['<%= config.test %>/*']
        tasks: ['newer:mochaTest']

    # Make sure code styles are up to par and there are no obvious mistakes
    jshint:
      options:
        jshintrc: '.jshintrc'
        reporter: require('jshint-stylish')
      all: [
        'Gruntfile.js'
        '<%= config.lib %>/*.js'
      ]

    # Mocha testing framework configuration options
    mochaTest:
      test:
        options:
          reporter: 'spec'
          clearRequireCache: true
        src: ['test/**/*.js']


    # Compiles coffee to js
    coffee:
      compile:
        options:
          sourceMap: false
        expand: true
        cwd: '<%= config.src %>'
        src: ['*.coffee']
        dest: '<%= config.lib %>'
        ext: '.js'

    # Make that js ish ugly
    uglify:
      options:
        sourceMap: true
      my_target:
        expand: true
        cwd: '<%= config.lib %>'
        src: ['*.js']
        dest: '<%= config.dist %>'
        ext: '.min.js'

    # Run sfw_model.js
    nodemon:
      options:
        watch: ["<%= config.lib %>"]
        args: ['dev']
      dev:
        script: '<%= config.lib %>/sfw_model.js'

  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-jshint'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-mocha-test'
  grunt.loadNpmTasks 'grunt-newer'
  grunt.loadNpmTasks 'grunt-nodemon'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  
  grunt.registerTask 'build', ['coffee:compile', 'jshint']
  grunt.registerTask 'test', ['newer:coffee:compile', 'newer:jshint', 'mochaTest']
  grunt.registerTask 'dist', ['build', 'test', 'uglify']
  grunt.registerTask 'watcher', ->
    # Run nodejs in a different process and display output on the main console
    nodemon = grunt.util.spawn(cmd: "grunt", grunt: true, args: "nodemon")
    nodemon.stdout.pipe process.stdout
    nodemon.stderr.pipe process.stderr
    grunt.task.run 'watch'
  grunt.registerTask 'default', ['newer:jshint', 'test', 'build']
  return
