function OnElement_Gateways(theElement) {
    var result = "";
    if (theElement.Stereotype == "Gateway" ||
        theElement.Metatype == "ExclusiveGateway" ||
        theElement.Metatype == "ParallelGateway") {

        var inCount = 0, outCount = 0;
        for (var i = 0; i < theElement.Connectors.Count; i++) {
            var c = theElement.Connectors.GetAt(i);
            if (c.Stereotype == "OperationalControlFlow" ||
                c.Stereotype == "OperationalObjectFlow") {
                if (c.SupplierID == theElement.ElementID) inCount++;
                if (c.ClientID == theElement.ElementID) outCount++;
            }
        }
        // Gateway muss mind. 1 ein- und mehrere ausgehende (Split) oder umgekehrt (Join) haben
        if (inCount == 0 || outCount == 0) {
            result += "L4-F Verstoß: Gateway '" + theElement.Name +
                "' hat keine vollständige Ein-/Ausgangsverbindung (in:" +
                inCount + " out:" + outCount + ").\n";
        }
    }
    return result;
}