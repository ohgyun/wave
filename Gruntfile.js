module.exports = function (grunt) {

  // 라이브리로드를 위한 코드 파일
  // https://github.com/gruntjs/grunt-contrib-livereload
  var path = require('path');
  var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;

  var folderMount = function folderMount(connect, point) {
    return connect.static(path.resolve(point));
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // 라이브리로드를 위한 웹서버 설정
    connect: {
      livereload: {
        options: {
          port: 7777,
          base: './',
          middleware: function(connect, options) {
            return [lrSnippet, folderMount(connect, options.base)];
          }
        }
      }
    },
    // 서버 개발 및 마크업 개발 시 파일 변경 감시를 위한 왓치 도구
    regarde: {
      development: {
        files: [
          'src/**/*.js',
          'test/**/*.js',
          'demo/**/*.js',
          'demo/**/*.html'
        ],
        tasks: ['livereload']
      }
    },

    clean: {
      build: ['build']
    },

    concat: {
      options: {
        banner: [
          '/*!',
          ' * <%= pkg.name %> v<%= pkg.version %> - <%= pkg.description %>',
          ' * https://github.com/ohgyun/wave',
          ' *',
          ' * (c) 2013, Ohgyun Ahn',
          ' * MIT License',
          ' */',
          ''
        ].join('\n'),
        separator: '\n\n'
      },
      build: {
        files: {
          'build/wave.js': [
            'src/intro.js',
            'src/simpleRequire.js',
            'src/util.js',
            'src/makePropertiable.js',
            'src/makeEventable.js',
            'src/audioContext.js',
            'src/soundLoader.js',
            'src/master.js',
            'src/Timer.js',
            'src/BufferSource.js',
            'src/Sound.js',
            'src/SoundMixed.js',
            'src/wave.js',
            'src/outro.js'
          ]
        }
      }
    },

    uglify: {
      build: {
        files: {
          'build/wave.min.js': 'build/wave.js'
        }
      }
    },

    copy: {
      release: {
        files: {
          'release/wave-<%= pkg.version %>.js': 'build/wave.js',
          'release/wave-<%= pkg.version %>.min.js': 'build/wave.min.js'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-livereload');
  grunt.loadNpmTasks('grunt-regarde');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('livereload', ['livereload-start', 'connect', 'regarde:development']);
  grunt.registerTask('build', ['clean', 'concat', 'uglify']);
  grunt.registerTask('release', ['clean', 'concat', 'uglify', 'copy']);

};