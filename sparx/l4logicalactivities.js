function OnElement(theElement) {
    var result = "";

    // L4-D: jedes L4-Diagramm braucht StartEvent/EndEvent
    if (theElement.Stereotype == "OperationalActivityAction") {
        var hasIncoming = false, hasOutgoing = false;
        var conns = theElement.Connectors;
        for (var i = 0; i < conns.Count; i++) {
            var c = conns.GetAt(i);
            if (c.Stereotype == "OperationalControlFlow" ||
                c.Stereotype == "OperationalObjectFlow") {
                if (c.SupplierID == theElement.ElementID) hasIncoming = true;
                if (c.ClientID == theElement.ElementID) hasOutgoing = true;
            }
        }
        if (!hasIncoming && !hasOutgoing) {
            result += "L4-G Verstoß: '" + theElement.Name +
                "' ist nicht über ControlFlow/ObjectFlow verbunden.\n";
        }
    }

    // L4-K/J: OperationalRole muss PerformsInContext zu einer Activity haben (wenn keine Lane verwendet wird)
    if (theElement.Stereotype == "OperationalRole") {
        var hasPerformsInContext = false;
        for (var j = 0; j < theElement.Connectors.Count; j++) {
            if (theElement.Connectors.GetAt(j).Stereotype == "PerformsInContext")
                hasPerformsInContext = true;
        }
        var isInLane = (theElement.ParentID > 0 &&
            Repository.GetElementByID(theElement.ParentID).Stereotype == "Lane");
        if (!hasPerformsInContext && !isInLane) {
            result += "L4-J/K Verstoß: OperationalRole '" + theElement.Name +
                "' weder per Lane noch per PerformsInContext zugeordnet.\n";
        }
    }

    return result;
}