angular.module('gridster')
	.directive('gridsterNoDrag', function() {
		return {
			restrict: 'A',
			link: function(scope, $element) {
				$element.addClass('gridster-no-drag');
			}
		};
	});
