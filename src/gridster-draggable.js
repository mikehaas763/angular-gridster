angular.module('gridster')

.factory('GridsterDraggable', ['$document', '$timeout', '$window', 'GridsterTouch',
	function($document, $timeout, $window, GridsterTouch) {
		function GridsterDraggable($el, scope, gridster, item, itemOptions) {

			var elmX, elmY, elmW, elmH,

				mouseX = 0,
				mouseY = 0,
				lastMouseX = 0,
				lastMouseY = 0,
				mOffX = 0,
				mOffY = 0,

				minTop = 0,
				maxTop = 9999,
				minLeft = 0,
				realdocument = $document[0];

			var originalCol, originalRow;
			var inputTags = ['select', 'input', 'textarea', 'button'];

			function mouseDown(e) {
				if (inputTags.indexOf(e.target.nodeName.toLowerCase()) !== -1) {
					return false;
				}

				var $target = angular.element(e.target);

				// exit, if a resize handle was hit
				if ($target.hasClass('gridster-item-resizable-handler')) {
					return false;
				}

				// exit, if the target has it's own click event
				if ($target.attr('onclick') || $target.attr('ng-click')) {
					return false;
				}

				// only works if you have jQuery
				if ($target.closest && $target.closest('.gridster-no-drag').length) {
					return false;
				}

				switch (e.which) {
					case 1:
						// left mouse button
						break;
					case 2:
					case 3:
						// right or middle mouse button
						return;
				}

				lastMouseX = e.pageX;
				lastMouseY = e.pageY;

				elmX = parseInt($el.css('left'), 10);
				elmY = parseInt($el.css('top'), 10);
				elmW = $el[0].offsetWidth;
				elmH = $el[0].offsetHeight;

				originalCol = item.col;
				originalRow = item.row;

				dragStart(e);

				return true;
			}

			function mouseMove(e) {
				if (!$el.hasClass('gridster-item-moving') || $el.hasClass('gridster-item-resizing')) {
					return false;
				}

				var maxLeft = gridster.curWidth - 1;

				// Get the current mouse position.
				mouseX = e.pageX;
				mouseY = e.pageY;

				// Get the deltas
				var diffX = mouseX - lastMouseX + mOffX;
				var diffY = mouseY - lastMouseY + mOffY;
				mOffX = mOffY = 0;

				// Update last processed mouse positions.
				lastMouseX = mouseX;
				lastMouseY = mouseY;

				var dX = diffX,
					dY = diffY;
				if (elmX + dX < minLeft) {
					diffX = minLeft - elmX;
					mOffX = dX - diffX;
				} else if (elmX + elmW + dX > maxLeft) {
					diffX = maxLeft - elmX - elmW;
					mOffX = dX - diffX;
				}

				if (elmY + dY < minTop) {
					diffY = minTop - elmY;
					mOffY = dY - diffY;
				} else if (elmY + elmH + dY > maxTop) {
					diffY = maxTop - elmY - elmH;
					mOffY = dY - diffY;
				}
				elmX += diffX;
				elmY += diffY;

				// set new position
				$el.css({
					'top': elmY + 'px',
					'left': elmX + 'px'
				});

				drag(e);

				return true;
			}

			function mouseUp(e) {
				if (!$el.hasClass('gridster-item-moving') || $el.hasClass('gridster-item-resizing')) {
					return false;
				}

				mOffX = mOffY = 0;

				dragStop(e);

				return true;
			}

			function dragStart(event) {
				$el.addClass('gridster-item-moving');
				gridster.movingItem = item;

				gridster.updateHeight(item.sizeY);
				scope.$apply(function() {
					if (gridster.draggable && gridster.draggable.start) {
						gridster.draggable.start(event, $el, itemOptions);
					}
				});
			}

			function drag(event) {
				var oldRow = item.row,
					oldCol = item.col,
					hasCallback = gridster.draggable && gridster.draggable.drag,
					scrollSensitivity = gridster.draggable.scrollSensitivity,
					scrollSpeed = gridster.draggable.scrollSpeed;

				var row = gridster.pixelsToRows(elmY);
				var col = gridster.pixelsToColumns(elmX);

				var itemsInTheWay = gridster.getItems(row, col, item.sizeX, item.sizeY, item);
				var hasItemsInTheWay = itemsInTheWay.length !== 0;

				if (gridster.swapping === true && hasItemsInTheWay) {
					var boundingBoxItem = gridster.getBoundingBox(itemsInTheWay),
						sameSize = boundingBoxItem.sizeX === item.sizeX && boundingBoxItem.sizeY === item.sizeY,
						sameRow = boundingBoxItem.row === oldRow,
						sameCol = boundingBoxItem.col === oldCol,
						samePosition = boundingBoxItem.row === row && boundingBoxItem.col === col,
						inline = sameRow || sameCol;

					if (sameSize && itemsInTheWay.length === 1) {
						if (samePosition) {
							gridster.swapItems(item, itemsInTheWay[0]);
						} else if (inline) {
							return;
						}
					} else if (boundingBoxItem.sizeX <= item.sizeX && boundingBoxItem.sizeY <= item.sizeY && inline) {
						var emptyRow = item.row <= row ? item.row : row + item.sizeY,
							emptyCol = item.col <= col ? item.col : col + item.sizeX,
							rowOffset = emptyRow - boundingBoxItem.row,
							colOffset = emptyCol - boundingBoxItem.col;

						for (var i = 0, l = itemsInTheWay.length; i < l; ++i) {
							var itemInTheWay = itemsInTheWay[i];

							var itemsInFreeSpace = gridster.getItems(
								itemInTheWay.row + rowOffset,
								itemInTheWay.col + colOffset,
								itemInTheWay.sizeX,
								itemInTheWay.sizeY,
								item
							);

							if (itemsInFreeSpace.length === 0) {
								gridster.putItem(itemInTheWay, itemInTheWay.row + rowOffset, itemInTheWay.col + colOffset);
							}
						}
					}
				}

				if (gridster.pushing !== false || !hasItemsInTheWay) {
					item.row = row;
					item.col = col;
				}

				if (event.pageY - realdocument.body.scrollTop < scrollSensitivity) {
					realdocument.body.scrollTop = realdocument.body.scrollTop - scrollSpeed;
				} else if ($window.innerHeight - (event.pageY - realdocument.body.scrollTop) < scrollSensitivity) {
					realdocument.body.scrollTop = realdocument.body.scrollTop + scrollSpeed;
				}

				if (event.pageX - realdocument.body.scrollLeft < scrollSensitivity) {
					realdocument.body.scrollLeft = realdocument.body.scrollLeft - scrollSpeed;
				} else if ($window.innerWidth - (event.pageX - realdocument.body.scrollLeft) < scrollSensitivity) {
					realdocument.body.scrollLeft = realdocument.body.scrollLeft + scrollSpeed;
				}

				if (hasCallback || oldRow !== item.row || oldCol !== item.col) {
					scope.$apply(function() {
						if (hasCallback) {
							gridster.draggable.drag(event, $el, itemOptions);
						}
					});
				}
			}

			function dragStop(event) {
				$el.removeClass('gridster-item-moving');
				var row = gridster.pixelsToRows(elmY);
				var col = gridster.pixelsToColumns(elmX);
				if (gridster.pushing !== false || gridster.getItems(row, col, item.sizeX, item.sizeY, item).length === 0) {
					item.row = row;
					item.col = col;
				}
				gridster.movingItem = null;
				item.setPosition(item.row, item.col);

				scope.$apply(function() {
					if (gridster.draggable && gridster.draggable.stop) {
						gridster.draggable.stop(event, $el, itemOptions);
					}
				});
			}

			var enabled = null;
			var $dragHandles = null;
			var unifiedInputs = [];

			this.enable = function() {
				if (enabled === true) {
					return;
				}

				// disable and timeout required for some template rendering
				$timeout(function() {
					// disable any existing draghandles
					for (var u = 0, ul = unifiedInputs.length; u < ul; ++u) {
						unifiedInputs[u].disable();
					}
					unifiedInputs = [];

					if (gridster.draggable && gridster.draggable.handle) {
						$dragHandles = angular.element($el[0].querySelectorAll(gridster.draggable.handle));
						if ($dragHandles.length === 0) {
							// fall back to element if handle not found...
							$dragHandles = $el;
						}
					} else {
						$dragHandles = $el;
					}

					for (var h = 0, hl = $dragHandles.length; h < hl; ++h) {
						unifiedInputs[h] = new GridsterTouch($dragHandles[h], mouseDown, mouseMove, mouseUp);
						unifiedInputs[h].enable();
					}

					enabled = true;
				});
			};

			this.disable = function() {
				if (enabled === false) {
					return;
				}

				// timeout to avoid race contition with the enable timeout
				$timeout(function() {

					for (var u = 0, ul = unifiedInputs.length; u < ul; ++u) {
						unifiedInputs[u].disable();
					}

					unifiedInputs = [];
					enabled = false;

				});
			};

			this.toggle = function(enabled) {
				if (enabled) {
					this.enable();
				} else {
					this.disable();
				}
			};

			this.destroy = function() {
				this.disable();
			};
		}

		return GridsterDraggable;
	}
]);
