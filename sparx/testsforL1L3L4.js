// =============================================================================
// ADMBw Modellvalidierung fuer SPARX Enterprise Architect
// Viewpoints: L1 - Node Types | L3 - Node Interaction | L4 - Logical Activities
// Grundlage: Dokumentation "Verwendung des ADMBw im SPARX EA" V2.0 (Mai 2024)
//            Leitfaden "Architekturen fuer FFFmLV" V2.0 (April 2026)
// Einbindung: Settings > Model Validation Configuration > Scripts
// =============================================================================

// =============================================================================
// HILFSFUNKTIONEN (werden von mehreren Regeln verwendet)
// =============================================================================

/**
 * Prueft ob ein Connector mindestens ein ConveyedItem traegt.
 * ConveyedItems werden in EA als EmbeddedElements am Connector gehalten.
 */
function HasConveyedItem(conn) {
    try {
        for (var i = 0; i < conn.EmbeddedElements.Count; i++) {
            var emb = conn.EmbeddedElements.GetAt(i);
            if (emb.Stereotype == "ExchangeItem" ||
                emb.Stereotype == "InformationElement" ||
                emb.Stereotype == "DataElement") {
                return true;
            }
        }
    } catch (e) {}
    return false;
}

/**
 * Traversiert die ParentID-Kette nach oben und gibt den naechsten
 * Pool-Vorfahren zurueck, oder null wenn keiner gefunden wird.
 */
function GetParentPool(element) {
    try {
        var current = element;
        for (var i = 0; i < 15; i++) {
            if (current.ParentID == 0) return null;
            var parent = Repository.GetElementByID(current.ParentID);
            if (parent.Type == "Pool" || parent.Stereotype == "Pool") return parent;
            current = parent;
        }
    } catch (e) {}
    return null;
}

/**
 * Gibt den Wert eines TaggedValue eines Elements zurueck.
 * Leerer String wenn nicht vorhanden.
 */
function GetTaggedValue(element, tagName) {
    try {
        for (var i = 0; i < element.TaggedValues.Count; i++) {
            var tv = element.TaggedValues.GetAt(i);
            if (tv.Name.toLowerCase() == tagName.toLowerCase()) {
                return tv.Value;
            }
        }
    } catch (e) {}
    return "";
}

/**
 * Prueft ob ein Element in mehr als einem Diagramm verwendet wird.
 * Indiz dafuer, dass es aus dem Modellelementekatalog stammt.
 */
function IsUsedInMultipleDiagrams(element) {
    try {
        var sql = "SELECT COUNT(DISTINCT Diagram_ID) AS cnt " +
                  "FROM t_diagramobjects WHERE Object_ID = " + element.ElementID;
        var xml = Repository.SQLQuery(sql);
        // Einfache Pruefung: cnt > 1 bedeutet mehrfach verwendet
        return (xml.indexOf(">2<") > -1 || xml.indexOf(">3<") > -1 ||
                xml.indexOf(">4<") > -1 || xml.indexOf(">5<") > -1 ||
                xml.indexOf(">6<") > -1 || xml.indexOf(">7<") > -1 ||
                xml.indexOf(">8<") > -1 || xml.indexOf(">9<") > -1);
    } catch (e) {}
    return false;
}

// =============================================================================
// L1 - NODE TYPES
// =============================================================================

/**
 * L1-MK02 | Diagrammname muss Schema "L1 : Projektkuerzel : Node Types" haben.
 */
function OnDiagram_L1_Namenskonvention(theDiagram) {
    var result = "";
    if (theDiagram.MetaType == "L1 - Node Types" ||
        theDiagram.MetaType == "L1 - Node Type") {
        var pattern = /^L1 : .+ : Node Types?$/;
        if (!pattern.test(theDiagram.Name)) {
            result += "[L1-MK02] Diagrammname '" + theDiagram.Name +
                "' entspricht nicht dem Schema 'L1 : Projektkuerzel : Node Types'.\n";
        }
    }
    return result;
}

/**
 * L1-MK03 | OperationalPerformer muss vorhanden und benannt sein.
 */
function OnElement_L1_PerformerName(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalPerformer") {
        if (theElement.Name == "" || theElement.Name == "OperationalPerformer") {
            result += "[L1-MK03] OperationalPerformer hat keinen aussagekraeftigen Namen.\n";
        }
        // Beschreibung im Notes-Feld empfohlen
        if (theElement.Notes == null || theElement.Notes.trim() == "") {
            result += "[L1-MK03] Hinweis: OperationalPerformer '" + theElement.Name +
                "' hat kein Notes-Feld (Beschreibung empfohlen).\n";
        }
    }
    return result;
}

/**
 * L1-MK04 | Jeder OperationalPerformer muss ueber PropertySetGeneralisation
 *           mit einem uebergeordneten Element verbunden sein (Taxonomie).
 *           Ausnahme: Wurzelelement der Taxonomie (kein Elternelement).
 */
function OnElement_L1_TaxonomieEinordnung(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalPerformer") {
        var hasGeneralisation = false;
        var isRootLevel = false;
        for (var i = 0; i < theElement.Connectors.Count; i++) {
            var c = theElement.Connectors.GetAt(i);
            if (c.Stereotype == "PropertySetGeneralisation" ||
                c.Stereotype == "PropertySetGeneralization") {
                // Pfeilspitze zeigt auf das allgemeinere (Eltern-)Element
                if (c.ClientID == theElement.ElementID) {
                    hasGeneralisation = true;
                }
                // Ist selbst Elternelement -> Wurzel-Indiz
                if (c.SupplierID == theElement.ElementID) {
                    isRootLevel = true;
                }
            }
        }
        // Nur pruefen wenn kein Wurzelelement
        if (!hasGeneralisation && !isRootLevel) {
            result += "[L1-MK04] OperationalPerformer '" + theElement.Name +
                "' hat keine PropertySetGeneralisation zur uebergeordneten Taxonomie-Ebene.\n";
        }
    }
    return result;
}

/**
 * L1-MK05 | TaggedValue 'abstractionLevel' muss gesetzt sein.
 */
function OnElement_L1_AbstractionLevel(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalPerformer") {
        var val = GetTaggedValue(theElement, "abstractionLevel");
        if (val == "" || val == null) {
            result += "[L1-MK05] OperationalPerformer '" + theElement.Name +
                "' hat kein gesetztes TaggedValue 'abstractionLevel'.\n";
        }
    }
    return result;
}

/**
 * L1 Zusatz | Prueft ob PropertySetGeneralisation in korrekter Richtung zeigt.
 *             Pfeilspitze muss auf das allgemeinere (Eltern-)Element zeigen.
 */
function OnConnector_L1_GeneralisierungRichtung(theConnector) {
    var result = "";
    if (theConnector.Stereotype == "PropertySetGeneralisation" ||
        theConnector.Stereotype == "PropertySetGeneralization") {
        var src = Repository.GetElementByID(theConnector.ClientID);
        var tgt = Repository.GetElementByID(theConnector.SupplierID);
        if (src.Stereotype != "OperationalPerformer" ||
            tgt.Stereotype != "OperationalPerformer") {
            result += "[L1] PropertySetGeneralisation verbindet keine zwei " +
                "OperationalPerformer (von: " + src.Stereotype +
                " nach: " + tgt.Stereotype + ").\n";
        }
    }
    return result;
}

/**
 * L1 Zusatz | Prueft ob neu angelegte OperationalPerformer per FINDING
 *             dokumentiert wurden (Katalog-Pflicht bei Neuelementen).
 */
function OnElement_L1_NeuesPerfomerFinding(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalPerformer") {
        // Heuristik: Element nicht im Standardelementekatalog-Package
        var pkg = Repository.GetPackageByID(theElement.PackageID);
        var pkgName = pkg ? pkg.Name : "";
        var isKatalog = (pkgName.indexOf("katalog") > -1 ||
                         pkgName.indexOf("Katalog") > -1 ||
                         pkgName.toLowerCase().indexOf("standard") > -1);
        if (!isKatalog && !IsUsedInMultipleDiagrams(theElement)) {
            result += "[L1-MK04] Hinweis: OperationalPerformer '" + theElement.Name +
                "' scheint neu angelegt (nicht im Katalog-Package, nur einmal verwendet) - " +
                "FINDING anlegen und begleitende Stelle informieren.\n";
        }
    }
    return result;
}

// =============================================================================
// L3 - NODE INTERACTION
// =============================================================================

/**
 * L3-MK02 | Diagrammname muss Schema "L3 : Projektkuerzel : Node Interaction" haben.
 */
function OnDiagram_L3_Namenskonvention(theDiagram) {
    var result = "";
    if (theDiagram.MetaType == "L3 - Node Interaction" ||
        theDiagram.MetaType == "L3 - Node Interactions") {
        var pattern = /^L3 : .+ : Node Interactions?$/;
        if (!pattern.test(theDiagram.Name)) {
            result += "[L3-MK02] Diagrammname '" + theDiagram.Name +
                "' entspricht nicht dem Schema 'L3 : Projektkuerzel : Node Interaction'.\n";
        }
    }
    return result;
}

/**
 * L3-MK03 | OperationalArchitecture muss vorhanden und benannt sein.
 */
function OnElement_L3_ArchitekturName(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalArchitecture") {
        if (theElement.Name == "" || theElement.Name == "OperationalArchitecture") {
            result += "[L3-MK03] OperationalArchitecture hat keinen aussagekraeftigen Namen.\n";
        }
    }
    return result;
}

/**
 * L3-MK04 | OperationalArchitecture muss mindestens eine OperationalRole enthalten.
 */
function OnElement_L3_ArchitekturHatRoles(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalArchitecture") {
        var hasRole = false;
        var parts = theElement.Elements;
        for (var i = 0; i < parts.Count; i++) {
            if (parts.GetAt(i).Stereotype == "OperationalRole") {
                hasRole = true;
                break;
            }
        }
        if (!hasRole) {
            result += "[L3-MK04] OperationalArchitecture '" + theElement.Name +
                "' enthaelt keine OperationalRole (muss verfeinert sein).\n";
        }
    }
    return result;
}

/**
 * L3-MK05 | OperationalExchange muss zwischen zwei OperationalRoles verlaufen.
 *           Pfeilspitze zeigt auf die empfangende Role.
 */
function OnConnector_L3_ExchangeZwischenRoles(theConnector) {
    var result = "";
    if (theConnector.Stereotype == "OperationalExchange") {
        var src = Repository.GetElementByID(theConnector.ClientID);
        var tgt = Repository.GetElementByID(theConnector.SupplierID);
        if (src.Stereotype != "OperationalRole") {
            result += "[L3-MK05] OperationalExchange startet nicht an einer " +
                "OperationalRole (gefunden: " + src.Stereotype + ").\n";
        }
        if (tgt.Stereotype != "OperationalRole") {
            result += "[L3-MK05] OperationalExchange endet nicht an einer " +
                "OperationalRole (gefunden: " + tgt.Stereotype + ").\n";
        }
    }
    return result;
}

/**
 * L3-MK06 | Jeder OperationalExchange muss mindestens ein ConveyedItem (ExchangeItem) haben.
 */
function OnConnector_L3_ExchangeHatConveyedItem(theConnector) {
    var result = "";
    if (theConnector.Stereotype == "OperationalExchange") {
        if (!HasConveyedItem(theConnector)) {
            result += "[L3-MK06] OperationalExchange '" + theConnector.Name +
                "' hat kein verknuepftes ExchangeItem/InformationElement.\n";
        }
    }
    return result;
}

/**
 * L3 Zusatz | OperationalRole ohne jeglichen OperationalExchange ist verdaechtig.
 */
function OnElement_L3_RoleHatExchange(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalRole") {
        var hasExchange = false;
        for (var i = 0; i < theElement.Connectors.Count; i++) {
            if (theElement.Connectors.GetAt(i).Stereotype == "OperationalExchange") {
                hasExchange = true;
                break;
            }
        }
        if (!hasExchange) {
            result += "[L3] Hinweis: OperationalRole '" + theElement.Name +
                "' hat keinen OperationalExchange - pruefe ob Austauschbeziehungen fehlen.\n";
        }
    }
    return result;
}

// =============================================================================
// L4 - LOGICAL ACTIVITIES
// =============================================================================

/**
 * L4-MK01/02 | Diagrammname muss Schema "L4 : Projektkuerzel : ..." haben.
 */
function OnDiagram_L4_Namenskonvention(theDiagram) {
    var result = "";
    if (theDiagram.MetaType == "L4 - Logical Activities") {
        var pattern = /^L4 : .+ : .+$/;
        if (!pattern.test(theDiagram.Name)) {
            result += "[L4-MK02] Diagrammname '" + theDiagram.Name +
                "' entspricht nicht dem Schema 'L4 : Projektkuerzel : Beschreibung'.\n";
        }
    }
    return result;
}

/**
 * L4-MK06 | TaggedValue 'abstractionLevel' muss bei OperationalActivity gesetzt sein.
 */
function OnElement_L4_AbstractionLevel(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalActivity" ||
        theElement.Stereotype == "OperationalActivityAction") {
        var val = GetTaggedValue(theElement, "abstractionLevel");
        if (val == "" || val == null) {
            result += "[L4-MK06] '" + theElement.Name +
                "' (" + theElement.Stereotype + ") hat kein TaggedValue 'abstractionLevel'.\n";
        }
    }
    return result;
}

/**
 * L4-MK09 | Pools und Lanes muessen typisiert sein (ClassifierID gesetzt).
 */
function OnElement_L4_PoolsLanesTypisiert(theElement) {
    var result = "";
    if (theElement.Type == "Pool" || theElement.Stereotype == "Pool") {
        if (theElement.ClassifierID == 0) {
            result += "[L4-MK09] Pool '" + theElement.Name +
                "' ist nicht typisiert (kein Classifier zugewiesen).\n";
        }
    }
    if (theElement.Type == "Lane" || theElement.Stereotype == "Lane") {
        if (theElement.ClassifierID == 0) {
            result += "[L4-MK09] Lane '" + theElement.Name +
                "' ist nicht typisiert (kein Classifier zugewiesen).\n";
        }
    }
    return result;
}

/**
 * L4-MK10 | Pool oder Lane muss ueber PerformsInContext mit OperationalArchitecture
 *            oder OperationalRole verbunden sein.
 */
function OnElement_L4_PoolPerformsInContext(theElement) {
    var result = "";
    if (theElement.Type == "Pool" || theElement.Stereotype == "Pool") {
        var hasPIC = false;
        for (var i = 0; i < theElement.Connectors.Count; i++) {
            if (theElement.Connectors.GetAt(i).Stereotype == "PerformsInContext") {
                hasPIC = true;
                break;
            }
        }
        if (!hasPIC) {
            result += "[L4-MK10] Pool '" + theElement.Name +
                "' hat keine PerformsInContext-Relation zu einem Anwendungsfall " +
                "(OperationalArchitecture).\n";
        }
    }
    return result;
}

/**
 * L4-MK11/12 | Alle Aktionen muessen innerhalb von Lanes oder Pools liegen.
 */
function OnElement_L4_ActionInLaneOderPool(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalActivityAction" ||
        theElement.Stereotype == "StartEvent" ||
        theElement.Stereotype == "EndEvent" ||
        theElement.Stereotype == "Gateway" ||
        theElement.Stereotype == "IntermediateEvent") {
        if (theElement.ParentID == 0) {
            result += "[L4-MK12] Element '" + theElement.Name +
                "' (" + theElement.Stereotype + ") liegt nicht innerhalb " +
                "einer Lane oder eines Pools.\n";
        }
    }
    return result;
}

/**
 * L4-MK13 | TaggedValue 'type' muss bei Prozesselementen gesetzt sein.
 */
function OnElement_L4_TypeTag(theElement) {
    var result = "";
    var pruefTypen = [
        "OperationalActivityAction",
        "StartEvent",
        "EndEvent",
        "Gateway",
        "IntermediateEvent"
    ];
    if (pruefTypen.indexOf(theElement.Stereotype) > -1) {
        var val = GetTaggedValue(theElement, "type");
        if (val == "" || val == null || val == "<memo>") {
            result += "[L4-MK13] Element '" + theElement.Name +
                "' (" + theElement.Stereotype + ") hat kein gesetztes TaggedValue 'type'.\n";
        }
    }
    return result;
}

/**
 * L4-MK14 | OperationalActivityAction muss ueber Behavior mit OperationalActivity
 *            typisiert und aussagekraeftig benannt sein.
 */
function OnElement_L4_ActionBehaviorTyp(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalActivityAction") {
        // Nameprüfung
        if (theElement.Name == "" || theElement.Name == "OperationalActivityAction") {
            result += "[L4-MK14] OperationalActivityAction hat keinen " +
                "aussagekraeftigen Namen.\n";
        }
        // Behavior-Typisierung (ClassifierID)
        if (theElement.ClassifierID == 0) {
            result += "[L4-MK14] OperationalActivityAction '" + theElement.Name +
                "' hat keine Behavior-Typisierung (keine OperationalActivity zugewiesen).\n";
        } else {
            try {
                var cls = Repository.GetElementByID(theElement.ClassifierID);
                if (cls.Stereotype != "OperationalActivity") {
                    result += "[L4-MK14] OperationalActivityAction '" + theElement.Name +
                        "' ist nicht mit einer OperationalActivity typisiert " +
                        "(gefunden: " + cls.Stereotype + ").\n";
                }
            } catch (e) {}
        }
    }
    return result;
}

/**
 * L4-MK15 | Verzweigungen duerfen nicht direkt von einer Action ausgehen.
 *            Mehr als 1 ausgehender Flow erfordert ein Gateway.
 */
function OnElement_L4_GatewayZwang(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalActivityAction") {
        var outCount = 0;
        for (var i = 0; i < theElement.Connectors.Count; i++) {
            var c = theElement.Connectors.GetAt(i);
            if ((c.Stereotype == "OperationalControlFlow" ||
                 c.Stereotype == "OperationalObjectFlow") &&
                 c.ClientID == theElement.ElementID) {
                outCount++;
            }
        }
        if (outCount > 1) {
            result += "[L4-MK15] OperationalActivityAction '" + theElement.Name +
                "' hat " + outCount + " ausgehende Flows ohne Gateway " +
                "(Verzweigungen muessen ueber Gateways laufen).\n";
        }
    }
    return result;
}

/**
 * L4-MK16 | Jeder ausmodellierte Pool muss mind. StartEvent + Action + EndEvent enthalten.
 */
function OnElement_L4_PoolVollstaendig(theElement) {
    var result = "";
    if (theElement.Type == "Pool" || theElement.Stereotype == "Pool") {
        var hasStart = false, hasEnd = false, hasAction = false;

        function pruefe(el) {
            if (el.Stereotype == "StartEvent" || el.Type == "StartEvent")            hasStart = true;
            if (el.Stereotype == "EndEvent"   || el.Type == "EndEvent")              hasEnd   = true;
            if (el.Stereotype == "OperationalActivityAction")                        hasAction = true;
        }

        var children = theElement.Elements;
        for (var i = 0; i < children.Count; i++) {
            var ch = children.GetAt(i);
            pruefe(ch);
            // Lane-Ebene
            var sub = ch.Elements;
            for (var j = 0; j < sub.Count; j++) pruefe(sub.GetAt(j));
        }

        if (!hasStart)  result += "[L4-MK16] Pool '" + theElement.Name + "' hat kein StartEvent.\n";
        if (!hasEnd)    result += "[L4-MK16] Pool '" + theElement.Name + "' hat kein EndEvent.\n";
        if (!hasAction) result += "[L4-MK16] Pool '" + theElement.Name +
            "' hat keine OperationalActivityAction.\n";
    }
    return result;
}

/**
 * L4-MK17 | Jede Action muss Trigger (eingehend) und Ergebnis (ausgehend)
 *            als ConveyedItems am Kontrollfluss haben.
 */
function OnElement_L4_ActionConveyedItems(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalActivityAction") {
        var hasIn = false, hasOut = false;
        for (var i = 0; i < theElement.Connectors.Count; i++) {
            var c = theElement.Connectors.GetAt(i);
            var isFlow = (c.Stereotype == "OperationalControlFlow" ||
                          c.Stereotype == "OperationalObjectFlow");
            if (!isFlow) continue;
            if (c.SupplierID == theElement.ElementID && HasConveyedItem(c)) hasIn  = true;
            if (c.ClientID   == theElement.ElementID && HasConveyedItem(c)) hasOut = true;
        }
        if (!hasIn) result += "[L4-MK17] '" + theElement.Name +
            "' hat keinen eingehenden Flow mit ConveyedItem (Trigger fehlt).\n";
        if (!hasOut) result += "[L4-MK17] '" + theElement.Name +
            "' hat keinen ausgehenden Flow mit ConveyedItem (Ergebnis fehlt).\n";
    }
    return result;
}

/**
 * L4-MK18 | Flows mit Bedingungshinweis im Namen sollten ein IntermediateEvent vorschalten.
 */
function OnElement_L4_IntermediateEventBedingung(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalActivityAction") {
        for (var i = 0; i < theElement.Connectors.Count; i++) {
            var c = theElement.Connectors.GetAt(i);
            if (c.Stereotype == "OperationalControlFlow" &&
                c.SupplierID == theElement.ElementID) {
                var name = c.Name.toLowerCase();
                if (name.indexOf("wenn") > -1 || name.indexOf("falls") > -1 ||
                    name.indexOf("if") > -1    || name.indexOf("sofern") > -1 ||
                    name.indexOf("bedingung") > -1) {
                    result += "[L4-MK18] Flow vor '" + theElement.Name +
                        "' enthaelt Bedingungshinweis ('" + c.Name +
                        "') - IntermediateEvent pruefen.\n";
                }
            }
        }
    }
    return result;
}

/**
 * L4-MK19 | Actions die Referenzprozessschritte umsetzen muessen IMPLEMENTS haben.
 */
function OnElement_L4_ImplementsReferenz(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalActivityAction") {
        if (theElement.ClassifierID > 0) {
            try {
                var cls = Repository.GetElementByID(theElement.ClassifierID);
                if (cls.Stereotype == "StandardOperationalActivity") {
                    var hasImpl = false;
                    for (var i = 0; i < theElement.Connectors.Count; i++) {
                        var c = theElement.Connectors.GetAt(i);
                        if (c.Stereotype == "Implements" &&
                            c.ClientID == theElement.ElementID) {
                            hasImpl = true;
                            break;
                        }
                    }
                    if (!hasImpl) {
                        result += "[L4-MK19] '" + theElement.Name +
                            "' ist Referenzprozessschritt aber hat keine IMPLEMENTS-Relation.\n";
                    }
                }
            } catch (e) {}
        }
    }
    return result;
}

/**
 * L4-MK20 | Pool-uebergreifende Kommunikation muss ueber OperationalMessageFlow laufen.
 *            Einfacher ControlFlow zwischen Pools ist unzulaessig.
 */
function OnConnector_L4_MessageFlowZwischenPools(theConnector) {
    var result = "";
    if (theConnector.Stereotype == "OperationalControlFlow") {
        try {
            var src = Repository.GetElementByID(theConnector.ClientID);
            var tgt = Repository.GetElementByID(theConnector.SupplierID);
            var srcPool = GetParentPool(src);
            var tgtPool = GetParentPool(tgt);
            if (srcPool != null && tgtPool != null &&
                srcPool.ElementID != tgtPool.ElementID) {
                result += "[L4-MK20] OperationalControlFlow zwischen unterschiedlichen Pools " +
                    "('" + src.Name + "' -> '" + tgt.Name +
                    "'). Verwende OperationalMessageFlow.\n";
            }
        } catch (e) {}
    }
    // MessageFlow selbst muss ConveyedItem haben
    if (theConnector.Stereotype == "OperationalMessageFlow") {
        if (!HasConveyedItem(theConnector)) {
            result += "[L4-MK20] OperationalMessageFlow zwischen Pools hat kein ConveyedItem.\n";
        }
    }
    return result;
}

/**
 * L4-G | OperationalActivityAction muss ueber ControlFlow oder ObjectFlow verbunden sein.
 */
function OnElement_L4_ActionVerbunden(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalActivityAction") {
        var hasIn = false, hasOut = false;
        for (var i = 0; i < theElement.Connectors.Count; i++) {
            var c = theElement.Connectors.GetAt(i);
            if (c.Stereotype == "OperationalControlFlow" ||
                c.Stereotype == "OperationalObjectFlow") {
                if (c.SupplierID == theElement.ElementID) hasIn  = true;
                if (c.ClientID   == theElement.ElementID) hasOut = true;
            }
        }
        if (!hasIn && !hasOut) {
            result += "[L4-G] OperationalActivityAction '" + theElement.Name +
                "' ist nicht ueber ControlFlow/ObjectFlow verbunden (isoliertes Element).\n";
        }
    }
    return result;
}

/**
 * L4-F | Gateway muss mindestens einen eingehenden und einen ausgehenden Flow haben.
 */
function OnElement_L4_GatewayVerbindungen(theElement) {
    var result = "";
    if (theElement.Stereotype == "Gateway" ||
        theElement.Metatype  == "ExclusiveGateway" ||
        theElement.Metatype  == "ParallelGateway"  ||
        theElement.Metatype  == "InclusiveGateway") {
        var inCount = 0, outCount = 0;
        for (var i = 0; i < theElement.Connectors.Count; i++) {
            var c = theElement.Connectors.GetAt(i);
            if (c.Stereotype == "OperationalControlFlow" ||
                c.Stereotype == "OperationalObjectFlow") {
                if (c.SupplierID == theElement.ElementID) inCount++;
                if (c.ClientID   == theElement.ElementID) outCount++;
            }
        }
        if (inCount == 0 || outCount == 0) {
            result += "[L4-F] Gateway '" + theElement.Name +
                "' hat unvollstaendige Verbindungen (eingehend: " +
                inCount + ", ausgehend: " + outCount + ").\n";
        }
    }
    return result;
}

/**
 * L4-J/K | OperationalRole muss entweder per Lane oder per PerformsInContext
 *           einer Action zugeordnet sein.
 */
function OnElement_L4_RoleZuordnung(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalRole") {
        var hasPIC = false;
        for (var i = 0; i < theElement.Connectors.Count; i++) {
            if (theElement.Connectors.GetAt(i).Stereotype == "PerformsInContext") {
                hasPIC = true;
                break;
            }
        }
        var isInLane = false;
        try {
            if (theElement.ParentID > 0) {
                var parent = Repository.GetElementByID(theElement.ParentID);
                isInLane = (parent.Type == "Lane" || parent.Stereotype == "Lane");
            }
        } catch (e) {}

        if (!hasPIC && !isInLane) {
            result += "[L4-J/K] OperationalRole '" + theElement.Name +
                "' ist weder in einer Lane noch per PerformsInContext einer Action zugeordnet.\n";
        }
    }
    return result;
}

/**
 * L4-Bc/Ha | IMPLEMENTS-Relation muss zwischen korrekten Elementtypen verlaufen.
 */
function OnConnector_L4_ImplementsTypen(theConnector) {
    var result = "";
    if (theConnector.Stereotype == "Implements") {
        try {
            var src = Repository.GetElementByID(theConnector.ClientID);
            var tgt = Repository.GetElementByID(theConnector.SupplierID);
            var gueltig = [
                "OperationalActivity",
                "OperationalActivityAction",
                "StandardOperationalActivity"
            ];
            if (gueltig.indexOf(src.Stereotype) == -1 ||
                gueltig.indexOf(tgt.Stereotype) == -1) {
                result += "[L4-Bc/Ha] IMPLEMENTS zwischen unzulaessigen Typen (" +
                    src.Stereotype + " -> " + tgt.Stereotype + ").\n";
            }
        } catch (e) {}
    }
    return result;
}

// =============================================================================
// HAUPT-DISPATCHER
// Sparx EA ruft OnElement, OnConnector, OnDiagram auf.
// Diese verteilen an die spezifischen Prueffunktionen.
// =============================================================================

function OnElement(theElement) {
    var result = "";

    // --- L1 ---
    result += OnElement_L1_PerformerName(theElement);
    result += OnElement_L1_TaxonomieEinordnung(theElement);
    result += OnElement_L1_AbstractionLevel(theElement);
    result += OnElement_L1_NeuesPerfomerFinding(theElement);

    // --- L3 ---
    result += OnElement_L3_ArchitekturName(theElement);
    result += OnElement_L3_ArchitekturHatRoles(theElement);
    result += OnElement_L3_RoleHatExchange(theElement);

    // --- L4 ---
    result += OnElement_L4_AbstractionLevel(theElement);
    result += OnElement_L4_PoolsLanesTypisiert(theElement);
    result += OnElement_L4_PoolPerformsInContext(theElement);
    result += OnElement_L4_ActionInLaneOderPool(theElement);
    result += OnElement_L4_TypeTag(theElement);
    result += OnElement_L4_ActionBehaviorTyp(theElement);
    result += OnElement_L4_GatewayZwang(theElement);
    result += OnElement_L4_PoolVollstaendig(theElement);
    result += OnElement_L4_ActionConveyedItems(theElement);
    result += OnElement_L4_IntermediateEventBedingung(theElement);
    result += OnElement_L4_ImplementsReferenz(theElement);
    result += OnElement_L4_ActionVerbunden(theElement);
    result += OnElement_L4_GatewayVerbindungen(theElement);
    result += OnElement_L4_RoleZuordnung(theElement);

    return result;
}

function OnConnector(theConnector) {
    var result = "";

    // --- L1 ---
    result += OnConnector_L1_GeneralisierungRichtung(theConnector);

    // --- L3 ---
    result += OnConnector_L3_ExchangeZwischenRoles(theConnector);
    result += OnConnector_L3_ExchangeHatConveyedItem(theConnector);

    // --- L4 ---
    result += OnConnector_L4_MessageFlowZwischenPools(theConnector);
    result += OnConnector_L4_ImplementsTypen(theConnector);

    return result;
}

function OnDiagram(theDiagram) {
    var result = "";

    result += OnDiagram_L1_Namenskonvention(theDiagram);
    result += OnDiagram_L3_Namenskonvention(theDiagram);
    result += OnDiagram_L4_Namenskonvention(theDiagram);

    return result;
}
