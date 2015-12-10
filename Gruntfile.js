'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      dev: ['build'],
      dist: ['dist']
    },

    babel: {
      options: {
        sourceMap: true
      },
      dev: {
        files: {
          'build/main.js': 'app/scripts/main.js'
        }
      },
    },

    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          'dist/index.html': 'dist/index.html'
        }
      }
    },

    watch: {
      app: {
        files: ['app/index.html', 'app/scripts/*.jsx'],
        options: {
          livereload: true
        },
        tasks: ["build"]
      }
    },

    connect: {
      dist: {
        options: {
          port: 9000,
          hostname: '0.0.0.0',
          base: 'build/'
        }
      }
    },

    targethtml: {

      // Remove livereload and its friends
      dist: {
        files: {
          'build/index.html': 'build/index.html'
        }
      }
    },

    copy: {
      dev: {
        files: [
          {'build/index.html': 'app/index.html'}
        ]
      },
      dist: {
        expand: true,
        flatten: true,
        files: [
          {'dist/index.html': 'build/index.html'},
          {'dist/main.js': 'build/main.js'},
          {'dist/main.css': 'build/main.css'},
          {'dist/CNAME': 'app/CNAME'},
          {'dist/meta.json':'app/meta.json'},
          {'dist/thumbnail.jpg':'app/thumbnail.jpg'}
        ]
      }
    },

    sass: {
      dev: {
        options: {
          style: 'expanded'
        },
        files: {
          'build/main.css': 'app/styles/main.scss',
        }
      }
    },

    uglify: {
      dist: {
        files: {
          'build/main.js': 'build/main.js'
        }
      }
    },

    'gh-pages': {
      options: {
        base: 'dist',
        branch: 'gh-pages',
      },
      src: '**/*'
    },

    rsync: {
      options: {
        args: ["--verbose"],
        exclude: [".git*","*.scss","node_modules"],
        recursive: true
      },
      showcase: {
        options: {
          src: "./dist/",
          dest: "/home/vagrant/web/rgbx",
          host: "showcase",
          delete: true // Careful this option could cause data loss, read the docs!
        }
      }
    },

  });


  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.loadNpmTasks('grunt-inline');
  grunt.loadNpmTasks('grunt-targethtml');
  grunt.loadNpmTasks('grunt-rsync');

  grunt.registerTask('build',  ['clean:dev', 'babel', 'sass', 'copy:dev']);
  grunt.registerTask('build:complete', ['build', 'clean:dist', 'uglify', 'targethtml:dist', 'copy:dist']);
  grunt.registerTask('serve',  ['build', 'connect', 'watch']);
  grunt.registerTask('deploy:staging', ['rsync']);
  grunt.registerTask('deploy:prod', ['gh-pages']);
};
