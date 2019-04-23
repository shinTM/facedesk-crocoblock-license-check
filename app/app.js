$(document).ready( function() {
	app.initialized().then(function(_client) {
		var client = _client,
			$eddLicense        = $( '.edd-license' ),
			$eddLicenseInfo    = $( '.edd-license__info', $eddLicense ),
			$refreshInfoButton = $( '.get-info', $eddLicense ),
			licenseFieldsDefault = {
				'success': {
					'label': 'Licence Status',
					'value': 'invalid'
				},
				'expires': {
					'label': 'License is valid until',
					'value': 'unknow'
				},
				'customer_email': {
					'label': 'Customer Email',
					'value': 'unknow'
				},
				'customer_name': {
					'label': 'Customer Name',
					'value': 'unknow'
				},
				'payment_id': {
					'label': 'Payment Id',
					'value': 'unknow'
				},
				'site_count': {
					'label': 'Site Count',
					'value': 'unknow'
				},
			},
			appActivatedRequest = false;

		client.events.on('app.activated', function() {
			if ( ! appActivatedRequest ) {
				appActivatedRequest = true;
				getLicenseInfo();
			}
		});

		$refreshInfoButton.on( 'click', function() {
			getLicenseInfo();
		} );

		function getLicenseInfo() {
			client.data.get('ticket').then( function( data ) {
				var ticketData  = data['ticket'] || false,
					license_key = ticketData['custom_fields']['cf_edd_licence_key'] || false;

				if ( ! license_key ) {

					client.interface.trigger( 'showNotify', {
						type: 'danger',
						title: 'Error',
						message: 'Create custom field with name "Edd Licence Key"(slug must be cf_edd_licence_key)',
					});

					return false;
				}

				// The url to the site running Easy Digital Downloads w/ Software Licensing
				var postUrl = 'https://account.crocoblock.com/?edd_action=check_license&license=' + license_key;

				$refreshInfoButton.addClass( 'loading' );
				client.request.get( postUrl, {} ).then(
					function( data ) {
						var response              = data['response'],
							responceData          = JSON.parse( response ),
							responceLicenseFields = {};

						for ( var field in licenseFieldsDefault ) {
							var defaultFieldInfo = licenseFieldsDefault[field];

							if ( responceData.hasOwnProperty( field ) ) {
								var responceDataValue = responceData[field];

								if ( 'success' == field ){
									responceDataValue = responceDataValue ? 'active' : 'invalid';
								}

								responceLicenseFields[field] = {
									'label': defaultFieldInfo['label'],
									'value': responceDataValue
								}
							}
						}

						$refreshInfoButton.removeClass( 'loading' );

						renderInfoBlock( responceLicenseFields );
					},
					function() {
						client.interface.trigger( 'showNotify', {
							type: 'danger',
							title: 'Error',
							message: 'License server Error',
						});
					}
				);

			}).catch( function(e) { console.log('Exception - ', e); } );
		};

		function renderInfoBlock( licenseFields = {} ) {
			var currentLicenseFields = $.extend({}, licenseFieldsDefault, licenseFields),
				licenseStatus        = currentLicenseFields['success'];

			$eddLicenseInfo.removeClass( 'license-status-invalid' );
			$eddLicenseInfo.removeClass( 'license-status-active' );
			$eddLicenseInfo.addClass( `license-status-${ licenseStatus['value'] }` );
			$eddLicenseInfo.html('');

			for ( var field in currentLicenseFields ) {
				var fieldInfo = currentLicenseFields[field],
					fieldHtml = `<div class="edd-license__info-field ${ field }-field"><span class="field-label">${ fieldInfo['label'] }:</span> <span class="field-value">${ fieldInfo['value'] }</span></div>`;

				$eddLicenseInfo.append( fieldHtml );
			}
		};
	});
});
