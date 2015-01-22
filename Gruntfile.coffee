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
        files: ['<%= config.dist %>/*.js']
        tasks: ['newer:jshint']

    # Make sure code styles are up to par and there are no obvious mistakes
    jshint:
      options:
        jshintrc: '.jshintrc'
        reporter: require('jshint-stylish')
      all: [
        'Gruntfile.js'
        '<%= config.dist %>/*.js'
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
        files:
          expand: true
          cwd: '<%= config.lib %>'
          src: ['*.js']
          dest: '<%= config.dist %>'
          ext: '.js'

  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-jshint'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-mocha-test'
  grunt.loadNpmTasks 'grunt-newer'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  
  grunt.registerTask 'build', ['coffee:compile', 'jshint']
  grunt.registerTask 'test', ['newer:coffee:compile', 'newer:jshint', 'mochaTest']
  grunt.registerTask 'dist', ['build', 'test', 'uglify']
  grunt.registerTask 'watcher', 'watch'
  grunt.registerTask 'default', ['newer:jshint', 'test', 'build']
  return
