module.exports = function(grunt){
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			output: ['dist']
		},
		copy: {
			main: {
				files: [
					{expand: true, cwd: 'src', src: ['index.html'], dest: 'dist/', filter: 'isFile'},
					{expand: true, cwd: 'src', src: ['ng-stats.js'], dest: 'dist/', filter: 'isFile'},
					{expand: true, cwd: '', src: ['*.json'], dest: 'dist/', filter: 'isFile'},
					{expand: true, cwd: '', src: ['README.md'], dest: 'dist/', filter: 'isFile'},
					{expand: true, cwd: 'src/lib/angular', src: ['angular.js'], dest: 'dist/lib/angular', filter: 'isFile'}
				]
			}
		},
		uglify: {
			options: {
			    banner: '/*! <%= pkg.name %> <%= pkg.version %> created by Kent C. Dodds | <%= grunt.template.today("yyyy-mm-dd") %> */\n'
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
		},
		'gh-pages': {
			options: {
				base: 'dist'
			},
			src: ['**/*.*']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-express-server');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-gh-pages');

	grunt.registerTask('release', ['clean', 'copy', 'uglify', 'gh-pages']);
	grunt.registerTask('default', ['express:server', 'watch'])
};
