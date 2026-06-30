function OnConnector_ExchangeConveyed(theConnector) {
    var result = "";
    if (theConnector.Stereotype == "OperationalExchange") {
        if (!HasConveyedItem(theConnector)) {
            result += "L4-Bb Verstoß: OperationalExchange '" + theConnector.Name +
                "' transportiert kein ConveyedItem (EXCHANGEITEM).\n";
        }
    }
    return result;
}