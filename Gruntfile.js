module.exports = function(grunt){
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			output: ['dist']
		},
		uglify: {
			options: {
			    banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			  },
			  dist: {
			    files: {
			      	'dist/<%= pkg.name %>.min.js': ['src/ng-stats.js']
			    }
			  }
		},
		express: {
			server: {
		        options: {
		            script: 'server.js'
		        }
		    }
		},
		watch: {
			livereload: {
		        options: {
		            livereload: true
		        },
		        files: [
		            'src/**/*.*'
		        ]
		    }
		}
	})

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-express-server');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('release', ['clean', 'uglify'])
	grunt.registerTask('default', ['express:server', 'watch'])
}