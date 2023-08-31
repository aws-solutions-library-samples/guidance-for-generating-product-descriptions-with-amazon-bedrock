registered_devices = [
    {
        "device_id": {
            "S": "dda07ffc-afd9-11ed-a5e7-53bcd9551de9"
        },
        "location": {
            "S": "HOMEOFFICE"
        },
        "customer": {
            "S": "MBAWS"
        },
        "provisioned_at": {
            "S": "2023/02/19 00:57:19"
        },
        "device_name": {
            "S": "HPLJ_MFP_M428FDW"
        }
    },
    {
        "device_id": {
            "S": "dda07ffc-afd9-11ed-a5e7-5123h;kde9"
        },
        "location": {
            "S": "HOMEOFFICE"
        },
        "customer": {
            "S": "MBAWS"
        },
        "provisioned_at": {
            "S": "2023/02/19 00:57:19"
        },
        "device_name": {
            "S": "HPLJ_MFP_M328FDW"
        }
    },
    {
        "device_id": {
            "S": "dda07ffc-afd9-11ed-jke7-512351de9"
        },
        "location": {
            "S": "HQ2"
        },
        "customer": {
            "S": "MBAWS"
        },
        "provisioned_at": {
            "S": "2023/02/19 00:57:19"
        },
        "device_name": {
            "S": "HPLJ_MFP_M328FDW"
        }
    },
    {
        "device_id": {
            "S": "dda07ffc-afd9-11ed-a5e7-51jklde9"
        },
        "location": {
            "S": "HQ6"
        },
        "customer": {
            "S": "OtherCustomer"
        },
        "provisioned_at": {
            "S": "2023/02/19 00:57:19"
        },
        "device_name": {
            "S": "HPLJ_MFP_M328FDW"
        }
    }
]

customers = list({x['customer']['S'] for x in registered_devices})
payload = []

for c in customers:
    customer_devices = {
        'customer': c
    }

    customer_locations = list({device['location']['S'] for device in registered_devices if device['customer']['S'] == c})
    customer_locations_cont = []

    for loc in customer_locations:
        location = {
            'location': loc
        }
        devices_at_location = []
        for device in registered_devices:
            if (device['location']['S'] == loc and device['customer']['S'] == c):
                device_at_location = { 'device_id': device['device_id']['S'], 'device_name': device['device_name']['S'] }
                devices_at_location.append(device_at_location)
        location['devices_at_location'] = devices_at_location
        customer_locations_cont.append(location)
    customer_devices['locations'] = customer_locations_cont
    payload.append(customer_devices)

print(payload)





