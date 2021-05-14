exports.getDataCityPronvice = async (request, response) => {
    try {

        var request = require("request");
        var result={
            province:{},
            city:{}
        };
        const dataProvince =  new Promise((resolve, reject) => {
            var options = {
                method: 'GET',
                url: 'https://api.rajaongkir.com/starter/province',
                headers: {key: '22cc24097e57c6a74d45e881605e23d0'}
            };
            request(options, function (error, response, body) {
                if (error) throw new Error(error);
                
                result.province = JSON.parse(body);
                resolve(result);
            });
            
        });
        const dataCity =  new Promise((resolve, reject) => {
            var options = {
                method: 'GET',
                url: 'https://api.rajaongkir.com/starter/city',
                headers: {key: '22cc24097e57c6a74d45e881605e23d0'}
            };
            request(options, function (error, response, body) {
                if (error) throw new Error(error);
                
                result.city = JSON.parse(body);
                resolve(result);
            });
            
        });

        try {
            await Promise.all([dataProvince,dataCity])
            return response.json(result);
        } 
        catch (error) {
            console.error(error);
            return response.status(500).json({ error: error });
        }
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }

}

exports.getShipmentCost = async (request, response) => {
    try {
        const requestQuery = request.query;
        const weight = requestQuery.weight || 0;
        const origin = requestQuery.origin || '';
        const destination = requestQuery.destination || '';
        const courier = requestQuery.courier || 'jne';

        var request = require("request");
        var result={};
        const dataCost =  new Promise((resolve, reject) => {
            var request = require("request");

            var options = {
                method: 'POST',
                url: 'https://api.rajaongkir.com/starter/cost',
                headers: {key: '22cc24097e57c6a74d45e881605e23d0', 'content-type': 'application/x-www-form-urlencoded'},
                form: {origin: origin, destination: destination, weight: weight, courier: courier}
            };

            request(options, function (error, response, body) {
                if (error) throw new Error(error);
                result = JSON.parse(body); 

                resolve(result);
            });
            
        });

        try {
            await Promise.all([dataCost])
            return response.json(result);
        } 
        catch (error) {
            console.error(error);
            return response.status(500).json({ error: error });
        }
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }

}

